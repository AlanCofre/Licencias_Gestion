// backend/controllers/licencias.controller.js  (ESM unificado)
import crypto from 'crypto';
import LicenciaMedica from '../src/models/modelo_LicenciaMedica.js';
import db from '../config/db.js';
import { decidirLicenciaSvc } from '../services/servicio_Licencias.js';
import fs from 'fs';
import path from 'path';
import http from 'http';
import https from 'https';
import { subirPDFLicencia } from '../services/supabase/storage.service.js';
// ✉️ Servicio de correos (solo para "nueva licencia")
import { notificarNuevaLicencia } from '../services/servicio_Correo.js';
import { calcularRegularidadEstudiante } from '../services/regularidad.service.js';


// 🔔 NUEVO IMPORT para correos de estudiante
import { 
  notificarLicenciaCreadaEstudiante,
  notificarEstadoLicenciaEstudiante 
} from '../services/servicio_Correo.js';

// === Utilidad: hash SHA-256 de un Buffer/String → hex 64
function sha256FromBuffer(bufOrStr) {
  const h = crypto.createHash('sha256');
  h.update(bufOrStr);
  return h.digest('hex');
}

// ---- Helpers para descarga segura (NO afectan a lo demás) ----
function _filenameFromRuta(ruta) {
  try {
    if (ruta?.startsWith('http')) {
      const u = new URL(ruta);
      return path.basename(u.pathname) || 'archivo';
    }
  } catch {}
  return path.basename(ruta || '') || 'archivo';
}

function _safeJoin(baseDir, relative) {
  const rootAbs = path.resolve(process.cwd(), baseDir || 'uploads');
  const rel = String(relative || '').replace(/^\/+/, '');
  const abs = path.resolve(rootAbs, rel);
  if (!abs.startsWith(rootAbs)) {
    const err = new Error('Ruta fuera de directorio permitido');
    err.code = 'E_PATH_TRAVERSAL';
    throw err;
  }
  return abs;
}

// funcionario → todo; estudiante → solo dueño
function _puedeVerArchivo(user, idPropietario) {
  if (!user) return false;
  const rol = String(user.rol || '').toLowerCase();
  if (rol === 'funcionario' || rol === 'secretario') return true;
  if (rol === 'estudiante' && Number(user.id_usuario) === Number(idPropietario)) return true;
  return false;
}

// =======================================================
// ✅ NUEVO CONTROLADOR: GET /api/licencias/mis-licencias
// =======================================================
export async function listarMisLicencias(req, res) {
  try {
    const idUsuario = req.user?.id_usuario ?? req.user?.id ?? null;
    if (!idUsuario) {
      return res.status(401).json({ ok: false, error: 'Usuario no autenticado' });
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const [rows] = await db.execute(
      `
      SELECT
        id_licencia AS id_licencia,
        folio,
        DATE_FORMAT(fecha_emision, '%Y-%m-%d') AS fecha_emision,
        DATE_FORMAT(fecha_inicio,  '%Y-%m-%d') AS fecha_inicio,
        DATE_FORMAT(fecha_fin,     '%Y-%m-%d') AS fecha_fin,
        estado,
        motivo_rechazo,
        DATE_FORMAT(fecha_creacion, '%Y-%m-%d %H:%i:%s') AS fecha_creacion,
        id_usuario
      FROM licenciamedica
      WHERE id_usuario = ?
      ORDER BY fecha_creacion DESC
      LIMIT ? OFFSET ?
      `,
      [idUsuario, limit, offset]
    );

    const [[{ total }]] = await db.execute(
      'SELECT COUNT(*) as total FROM licenciamedica WHERE id_usuario = ?',
      [idUsuario]
    );

    return res.status(200).json({ 
      ok: true, 
      data: rows,
      pagination: {
        page,
        limit,
        total: parseInt(total),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ [listarMisLicencias] error:', error);
    return res.status(500).json({
      ok: false,
      error: 'Error interno al obtener licencias del estudiante',
    });
  }
}

// ==

// =======================================================
// GET: listar licencias del usuario autenticado
// =======================================================
export async function listarLicencias(req, res) {
  try {
    const idUsuario = req.user?.id_usuario ?? req.user?.id ?? req.user?.sub ?? null;
    if (!idUsuario) {
      return res.status(401).json({ ok: false, mensaje: 'No autenticado' });
    }

    const page = Number.parseInt(req.query.page, 10) || 1;
    const limit = Number.parseInt(req.query.limit, 10) || 10;
    const offset = Math.max(0, (page - 1) * limit);

    const [rows] = await db.execute(
      `
      SELECT
        id_licencia AS id,
        DATE_FORMAT(fecha_creacion, '%Y-%m-%d %H:%i:%s') AS fecha_creacionFull,
        DATE_FORMAT(fecha_creacion, '%Y-%m-%d') AS fecha_creacion,
        DATE_FORMAT(fecha_inicio, '%Y-%m-%d') AS fecha_inicio,
        DATE_FORMAT(fecha_fin, '%Y-%m-%d') AS fecha_fin,
        estado
      FROM licenciamedica
      WHERE id_usuario = ?
      ORDER BY fecha_creacion DESC
      LIMIT ? OFFSET ?
      `,
      [idUsuario, limit, offset]
    );

    return res.json({ ok: true, data: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, mensaje: 'Error al listar licencias' });
  }
}

// =======================================================
// POST: crear licencia (con validaciones reales)
// =======================================================
function validarCampoFecha(fechaStr, campo = 'fecha') {
  const normalizada = String(fechaStr ?? '').trim();
  if (!normalizada || normalizada === 'dd-mm-aaaa') {
    return `${campo} es obligatorio.`;
  }
  return null;
}

export const crearLicencia = async (req, res) => {
  console.log('[crearLicencia] entrada - content-type=', req.headers['content-type']);
  console.log('[crearLicencia] body keys=', Object.keys(req.body || {}));
  console.log('[crearLicencia] file present=', !!req.file, ' files=', !!req.files);

  // Seguridad: ignorar campos enviados desde el cliente que no deben afectar la lógica del servidor
  try {
    if (req && req.body) {
      delete req.body.id_usuario;
      delete req.body.estado;
    }

    // Si multer usó diskStorage, intentar cargar buffer desde path para compatibilidad
    if (req.file && !req.file.buffer && req.file.path) {
      try {
        req.file.buffer = fs.readFileSync(req.file.path);
        req.file.size = req.file.size ?? req.file.buffer.length;
        console.log('[crearLicencia] archivo leído desde disco, size=', req.file.size);
      } catch (readErr) {
        console.error('[crearLicencia] error leyendo archivo desde path:', readErr);
        // no fallamos aquí: se validará más adelante y se dará error al cliente si corresponde
      }
    }

    // Nota: el resto de las validaciones (tipo PDF, existencia de archivo, etc.)
    // se realizan más abajo en la función; aquí nos aseguramos compatibilidad y seguridad.
  } catch (e) {
    console.warn('[crearLicencia] advertencia pre-checks:', e?.message || e);
  }

  try {
    const usuarioId = req.user?.id_usuario ?? req.id ?? null;
    const rol = (req.user?.rol ?? req.rol ?? '').toString().toLowerCase();

    if (!usuarioId) return res.status(401).json({ msg: 'No autenticado' });
    if (rol && rol !== 'estudiante') {
      return res.status(403).json({ msg: 'Solo estudiantes pueden crear licencias' });
    }

    // --- Normalizar body (evitar undefined) ---
    const _str = (v) => (v === undefined || v === null ? null : String(v).trim());
    const folio        = _str(req.body?.folio);
    const fecha_inicio = _str(req.body?.fecha_inicio);
    const fecha_fin    = _str(req.body?.fecha_fin);
    const motivo       = _str(req.body?.motivo);

    // Cursos: puede venir como array o como JSON-string desde el frontend
    let cursos = [];
    const cursosRaw = req.body?.cursos ?? null;
    if (cursosRaw) {
      try {
        cursos = typeof cursosRaw === 'string' ? JSON.parse(cursosRaw) : cursosRaw;
      } catch (e) {
        cursos = [];
      }
    }
    // Validación de seguridad: al menos un curso debe estar seleccionado
    if (!Array.isArray(cursos) || cursos.length === 0) {
      return res.status(400).json({
        ok: false,
        error: 'Debe seleccionar al menos un curso afectado antes de enviar la licencia.'
      });
    }

    // ✅ NOTA: La validación de matrículas ahora se hace en el middleware validarMatriculasActivas

    // Validaciones mínimas
    if (!folio) return res.status(400).json({ msg: 'El folio es obligatorio' });
    const isISO = (d) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d);
    if (!isISO(fecha_inicio) || !isISO(fecha_fin)) {
      return res.status(400).json({ msg: 'fecha_inicio/fecha_fin deben ser YYYY-MM-DD' });
    }
    if (new Date(fecha_inicio) > new Date(fecha_fin)) {
      return res.status(400).json({ msg: 'La fecha de inicio no puede ser posterior a la fecha fin' });
    }

    // Superposición
    const [solape] = await db.execute(
      `SELECT id_licencia FROM licenciamedica
       WHERE id_usuario = ? AND estado IN ('pendiente','aceptado')
         AND (? <= fecha_fin AND ? >= fecha_inicio) LIMIT 1`,
      [usuarioId, fecha_inicio, fecha_fin]
    );
    if (solape.length) {
      return res.status(409).json({ ok:false, code:'LICENCIA_FECHAS_SUPERPUESTAS', error:'Fechas superpuestas con otra licencia.' });
    }

    // Archivo
    let archivo = req.file;
    if (!archivo) archivo = (req.files && (req.files.archivo || req.files.file)) ?? null;
    if (archivo && !archivo.buffer && archivo.path) {
      archivo.buffer = fs.readFileSync(archivo.path);
      archivo.size = archivo.size ?? archivo.buffer.length;
    }
    if (!archivo) return res.status(400).json({ ok:false, error:'Falta archivo (PDF)' });
    if (archivo.mimetype !== 'application/pdf') {
      return res.status(415).json({ ok:false, error:'Solo se acepta PDF' });
    }

    // Hash anti-duplicado
    const sha = crypto.createHash('sha256').update(archivo.buffer).digest('hex');
    const [dup] = await db.execute(
      `SELECT al.id_archivo, lm.id_licencia
         FROM ArchivoLicencia al
         JOIN licenciamedica lm ON lm.id_licencia = al.id_licencia
        WHERE lm.id_usuario = ? AND al.hash = ? LIMIT 1`,
      [usuarioId, sha]
    );
    if (dup.length) {
      return res.status(409).json({ ok:false, code:'ARCHIVO_HASH_DUPLICADO', error:`Este archivo ya fue usado en la licencia #${dup[0].id_licencia}.` });
    }

    // 1) Insertar licencia (forzar NULLs donde corresponda)
    const [result] = await db.execute(
      `INSERT INTO licenciamedica
       (folio, fecha_emision, fecha_inicio, fecha_fin, estado, motivo_rechazo, fecha_creacion, id_usuario)
       VALUES (?, CURDATE(), ?, ?, 'pendiente', NULL, NOW(), ?)`,
      [
        folio ?? null,
        fecha_inicio ?? null,
        fecha_fin ?? null,
        usuarioId ?? null
      ]
    );
    const idLicencia = result.insertId;

    // ✅ Crear entregas de licencia para cada curso (las matrículas ya están validadas por el middleware)
    for (const idCurso of cursos) {
      await db.execute(
        `INSERT INTO licencias_entregas (id_licencia, id_curso, fecha_creacion)
         VALUES (?, ?, NOW())`,
        [idLicencia, idCurso]
      );
    }

    // 🔔 NOTIFICAR POR CORREO AL ESTUDIANTE (no bloqueante)
    try {
      // Obtener información del estudiante
      const [estudianteRows] = await db.execute(
        `SELECT correo_usuario, nombre FROM usuario WHERE id_usuario = ? LIMIT 1`,
        [usuarioId]
      );
      
      if (estudianteRows.length > 0) {
        const estudiante = estudianteRows[0];
        await notificarLicenciaCreadaEstudiante({
          to: estudiante.correo_usuario,
          folio: folio,
          estudianteNombre: estudiante.nombre,
          fechaInicio: fecha_inicio,
          fechaFin: fecha_fin
        });
        console.log(`📧 Correo de creación enviado a: ${estudiante.correo_usuario}`);
      }
    } catch (emailError) {
      console.error('❌ Error enviando correo de creación:', emailError);
      // No fallamos la creación por error de correo
    }

    // 2) Subir a Supabase
    const meta = await (async () => {
      const r = await subirPDFLicencia(archivo, usuarioId);
      // Normalizar por si acaso
      return {
        ruta_url: r?.ruta_url ?? null,
        tipo_mime: r?.tipo_mime ?? 'application/pdf',
        hash: r?.hash ?? sha,                           // usa el sha calculado si no vino
        tamano: Number(r?.tamano ?? archivo.size ?? archivo.buffer?.length ?? 0)
      };
    })();

    // Si falló la subida y vino algo undefined, corta con 502
    if (!meta?.ruta_url) {
      return res.status(502).json({ ok:false, error:'No se pudo subir el archivo a Storage' });
    }

    // 3) Guardar metadatos del archivo (NUNCA undefined → usa nulls y números)
    await db.execute(
      `INSERT INTO ArchivoLicencia (ruta_url, tipo_mime, hash, tamano, fecha_subida, id_licencia)
       VALUES (?, ?, ?, ?, NOW(), ?)`,
      [
        meta.ruta_url ?? null,
        meta.tipo_mime ?? 'application/pdf',
        meta.hash ?? sha,
        Number.isFinite(meta.tamano) ? meta.tamano : 0,
        idLicencia ?? null
      ]
    );

    return res.status(201).json({
      ok: true,
      msg: 'Licencia creada con éxito',
      licencia: {
        id_licencia: idLicencia,
        folio,
        fecha_emision: new Date().toISOString().slice(0, 10),
        fecha_inicio,
        fecha_fin,
        estado: 'pendiente',
        motivo_rechazo: null,
        fecha_creacion: new Date().toISOString(),
        id_usuario: usuarioId,
        motivo: motivo ?? null,
        archivo: { ruta_url: meta.ruta_url }
      }
    });
  } catch (error) {
    console.error('[licencias:crearLicencia] error:', error);
    return res.status(500).json({ msg: 'Error al crear la licencia' });
  }
};
// =====================================================
// GET: Licencias en revisión (funcionario/secretaría)
// =====================================================
export const getLicenciasEnRevision = async (req, res) => {
  try {
    const usuarioId = req.user?.id_usuario ?? req.id ?? null;
    const rol = (req.user?.rol ?? req.rol ?? '').toString().toLowerCase();
    if (!usuarioId) return res.status(401).json({ error: 'No autenticado' });

    const { nombre, folio, desde, hasta, page = 1, limit = 10 } = req.query;
    
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    let condiciones = [`lm.estado = 'pendiente'`];
    let params = [];

    if (['funcionario', 'secretario'].includes(rol)) {
      if (nombre) { 
        condiciones.push(`u.nombre LIKE ?`); 
        params.push(`%${nombre}%`); 
      }
      if (folio) { 
        condiciones.push(`lm.folio LIKE ?`); 
        params.push(`%${folio}%`); 
      }
      if (desde) { 
        condiciones.push(`lm.fecha_emision >= ?`); 
        params.push(desde); 
      }
      if (hasta) { 
        condiciones.push(`lm.fecha_emision <= ?`); 
        params.push(hasta); 
      }
    } else {
      condiciones.push(`lm.id_usuario = ?`);
      params.push(usuarioId);
    }

    const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

    const [rows] = await db.execute(`
      SELECT 
        lm.id_licencia, 
        lm.folio, 
        lm.fecha_emision, 
        lm.fecha_inicio, 
        lm.fecha_fin,
        lm.estado, 
        lm.motivo_rechazo, 
        lm.fecha_creacion, 
        lm.id_usuario, 
        u.nombre
      FROM licenciamedica lm
      FORCE INDEX (idx_licencia_estado, idx_licencia_completo)
      JOIN Usuario u FORCE INDEX (idx_usuario_nombre) ON lm.id_usuario = u.id_usuario
      ${where}
      ORDER BY lm.fecha_creacion DESC, lm.id_licencia DESC
      LIMIT ? OFFSET ?
    `, [...params, limitNum, offset]);

    const [countRows] = await db.execute(`
      SELECT COUNT(*) as total
      FROM licenciamedica lm
      ${where.includes('JOIN') ? where : `JOIN Usuario u ON lm.id_usuario = u.id_usuario ${where}`}
    `, params);

    const total = countRows[0]?.total || 0;

    return res.status(200).json({ 
      ok: true, 
      data: rows, 
      meta: { 
        page: pageNum, 
        limit: limitNum,
        total: parseInt(total),
        totalPages: Math.ceil(total / limitNum)
      } 
    });
  } catch (error) {
    console.error('[licencias:getLicenciasEnRevision] error:', error);
    return res.status(500).json({ ok: false, error: 'Error al obtener licencias en revisión' });
  }
};

// =======================================================
// ✅ Licencias Resueltas (FUNCIONARIO)
// =======================================================
export const licenciasResueltas = async (req, res) => {
  try {
    const rol = (req.user?.rol ?? req.rol ?? '').toString().toLowerCase();
    if (rol !== 'funcionario') {
      return res.status(403).json({ ok: false, error: 'Solo los funcionarios pueden ver esta lista.' });
    }

    const { estado, desde, hasta, nombre, folio, page = 1, limit = 20 } = req.query;
    
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    let condiciones = [`lm.estado IN ('aceptado', 'rechazado')`];
    let valores = [];

    if (estado && ['aceptado', 'rechazado'].includes(estado)) { 
      condiciones.push(`lm.estado = ?`); 
      valores.push(estado); 
    }
    if (nombre) { 
      condiciones.push(`u.nombre LIKE ?`); 
      valores.push(`%${nombre}%`); 
    }
    if (folio) { 
      condiciones.push(`lm.folio LIKE ?`); 
      valores.push(`%${folio}%`); 
    }
    if (desde) { 
      condiciones.push(`lm.fecha_emision >= ?`); 
      valores.push(desde); 
    }
    if (hasta) { 
      condiciones.push(`lm.fecha_emision <= ?`); 
      valores.push(hasta); 
    }

    const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

    const [rows] = await db.execute(`
      SELECT 
        lm.id_licencia, 
        lm.folio, 
        lm.fecha_emision, 
        lm.fecha_inicio, 
        lm.fecha_fin,
        lm.estado, 
        lm.motivo_rechazo, 
        lm.fecha_creacion, 
        lm.id_usuario, 
        u.nombre
      FROM licenciamedica lm
      FORCE INDEX (idx_licencia_completo)
      JOIN usuario u FORCE INDEX (idx_usuario_nombre) ON lm.id_usuario = u.id_usuario
      ${where}
      ORDER BY lm.fecha_creacion DESC
      LIMIT ? OFFSET ?
    `, [...valores, limitNum, offset]);

    const [countRows] = await db.execute(`
      SELECT COUNT(*) as total
      FROM licenciamedica lm
      JOIN usuario u ON lm.id_usuario = u.id_usuario
      ${where}
    `, valores);

    const total = countRows[0]?.total || 0;

    return res.status(200).json({ 
      ok: true, 
      data: rows, 
      meta: { 
        page: pageNum, 
        limit: limitNum,
        total: parseInt(total),
        totalPages: Math.ceil(total / limitNum)
      } 
    });
  } catch (error) {
    console.error('❌ Error al obtener licencias resueltas:', error);
    return res.status(500).json({ ok: false, error: 'Error interno del servidor' });
  }
};

// =====================================================
// ✅ FIX: Detalle de licencia con shape que espera el FE
// GET /api/licencias/:id
// =====================================================
export const detalleLicencia = async (req, res) => {
  try {
    const usuarioId = req.user?.id_usuario ?? req.id ?? null;
    const rol = (req.user?.rol ?? req.rol ?? '').toString().toLowerCase();
    const id = Number(req.params.id);

    if (!usuarioId) return res.status(401).json({ error: 'No autenticado' });
    if (!id) return res.status(400).json({ error: 'ID de licencia inválido' });

    const [rows] = await db.execute(
      `
      SELECT
        l.id_licencia,
        l.folio,
        l.fecha_emision,
        l.fecha_inicio,
        l.fecha_fin,
        l.estado,
        l.motivo_rechazo,
        l.fecha_creacion,
        l.id_usuario,

        u.id_usuario      AS usuario_id,
        u.nombre          AS usuario_nombre,
        u.correo_usuario  AS usuario_email
      FROM licenciamedica l
      LEFT JOIN usuario u ON u.id_usuario = l.id_usuario
      WHERE l.id_licencia = ?
      LIMIT 1
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Licencia no encontrada' });
    }

    const r = rows[0];

    if (!['funcionario','secretario'].includes(rol) && Number(r.id_usuario) !== Number(usuarioId)) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const licencia = {
      id_licencia: r.id_licencia,
      folio: r.folio,
      fecha_emision: r.fecha_emision,
      fecha_inicio: r.fecha_inicio,
      fecha_fin: r.fecha_fin,
      estado: r.estado,
      motivo_rechazo: r.motivo_rechazo,
      fecha_creacion: r.fecha_creacion,
      id_usuario: r.id_usuario,
      usuario: r.usuario_id
        ? {
            id_usuario: r.usuario_id,
            nombre: r.usuario_nombre,
            email: r.usuario_email,
          }
        : null,
      archivo: null,
    };

    try {
      const [archs] = await db.execute(
        `
        SELECT
          id_archivo,
          ruta_url,
          tipo_mime,
          hash,
          tamano,
          fecha_subida
        FROM archivolicencia
        WHERE id_licencia = ?
        ORDER BY id_archivo DESC
        LIMIT 1
        `,
        [id]
      );
      if (Array.isArray(archs) && archs.length > 0) {
        const a = archs[0];
        licencia.archivo = {
          id_archivo: a.id_archivo,
          nombre_archivo: 'licencia.pdf',
          ruta_url: a.ruta_url,
          mimetype: a.tipo_mime,
          hash: a.hash,
          tamano: a.tamano,
          fecha_subida: a.fecha_subida,
        };
      }
    } catch (e) {
      console.warn('Detalle: archivo omitido →', e?.message);
    }

    return res.json({ ok: true, licencia });
  } catch (error) {
    console.error('[licencias:detalleLicencia] error:', error);
    return res.status(500).json({ error: 'Error al obtener detalle de licencia' });
  }
};

// =====================================================
// POST (legacy)
// =====================================================
export const crearLicenciaLegacy = async (req, res) => {
  try {
    const { id_usuario, rol } = req.user || {};
    if (!id_usuario) {
      return res.status(401).json({ ok: false, mensaje: 'No autenticado' });
    }
    const rolLower = (rol || '').toString().toLowerCase();
    if (!['estudiante', 'alumno'].includes(rolLower)) {
      return res.status(403).json({ ok: false, mensaje: 'Solo estudiantes pueden crear licencias' });
    }

    const { fecha_inicio, fecha_fin } = req.body || {};
    const isISO = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d);

    if (!isISO(fecha_inicio) || !isISO(fecha_fin)) {
      return res.status(400).json({ ok: false, mensaje: 'fecha_inicio/fecha_fin deben ser YYYY-MM-DD' });
    }
    if (new Date(fecha_inicio) > new Date(fecha_fin)) {
      return res.status(400).json({ ok: false, mensaje: 'fecha_inicio no puede ser posterior a fecha_fin' });
    }

    const [u] = await db.execute('SELECT id_usuario FROM Usuario WHERE id_usuario = ?', [id_usuario]);
    if (!u.length) return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado' });

    const folio = String(req.body?.folio ?? "").trim();
    if (!folio) {
      return res.status(400).json({ ok: false, mensaje: "El folio es obligatorio" });
    }

    const sql = `
      INSERT INTO licenciamedica
        (folio, fecha_emision, fecha_inicio, fecha_fin, estado, motivo_rechazo, fecha_creacion, id_usuario)
      VALUES
        (?,     CURDATE(),     ?,            ?,          'pendiente', NULL,            NOW(),     ?)
    `;
    const [result] = await db.execute(sql, [folio, fecha_inicio, fecha_fin, id_usuario]);

    // 🔎 AUDIT: emitir licencia (legacy)
    try {
      await req.audit('emitir licencia', 'licenciamedica', {
        id_licencia: result.insertId,
        estado: 'pendiente',
        folio,
        fecha_inicio,
        fecha_fin
      });
    } catch (e) {
      console.warn('[audit] crearLicenciaLegacy:', e?.message || e);
    }

    const [row] = await db.execute(
      'SELECT id_licencia, folio, fecha_emision, fecha_inicio, fecha_fin, estado, motivo_rechazo, fecha_creacion, id_usuario FROM licenciamedica WHERE id_licencia = ?',
      [result.insertId]
    );

    return res.status(201).json({ ok: true, mensaje: 'Licencia creada', data: row[0] });
  } catch (e) {
    console.error('❌ [licencias:crearLicenciaLegacy] error:', e);
    return res.status(500).json({ ok: false, mensaje: 'Error creando licencia', detalle: e.message });
  }
};

// === Controller: decidirLicencia (sin correos)
export async function decidirLicencia(req, res) {
  try {
    const idLicencia   = Number(req.params.id);
    const actorId = req.user?.id_usuario ?? null;

    if (!actorId) return res.status(401).json({ ok: false, error: 'No autenticado' });
    if (!idLicencia) return res.status(400).json({ ok: false, error: 'ID de licencia inválido' });

    const decisionRaw = String(req.body.decision ?? req.body.estado ?? '').toLowerCase();
    if (!['aceptado', 'rechazado'].includes(decisionRaw)) {
      return res.status(422).json({ ok: false, error: 'Decision inválida' });
    }

    const motivo_rechazo = req.body.motivo_rechazo ?? null;
    if (decisionRaw === 'rechazado') {
      const motivoOk = typeof motivo_rechazo === 'string' && motivo_rechazo.trim().length >= 10;
      if (!motivoOk) {
        return res.status(400).json({ ok: false, error: 'motivo_rechazo es obligatorio (≥10 caracteres)' });
      }
    }
    if (decisionRaw === 'aceptado') {
      const [archivos] = await db.execute(
        `SELECT hash FROM ArchivoLicencia WHERE id_licencia = ? LIMIT 1`,
        [idLicencia]
      );
      if (!archivos.length || !archivos[0].hash) {
        return res.status(422).json({ ok: false, error: 'No se puede aceptar sin archivo válido (hash)' });
      }
    }
    
    const payload = {
      idLicencia,
      decision: decisionRaw,
      estado: decisionRaw,
      motivo_rechazo: motivo_rechazo ?? null,
      observacion: req.body.observacion ?? null,
      _fi: req.body._fi,
      _ff: req.body._ff,
      idFuncionario: actorId,
      idfuncionario: actorId,
      id_usuario: actorId
    };

    const out = await decidirLicenciaSvc(payload);

    // 🔎 AUDITORÍA — aceptar / rechazar (servicio decidirLicencia)
    try {
      const accion = (decisionRaw === 'aceptado') ? 'aceptar licencia' : 'rechazar licencia';
      const pl = {
        id_licencia: idLicencia,
        estado_nuevo: decisionRaw
      };
      if (decisionRaw === 'rechazado') pl.motivo_rechazo = motivo_rechazo;

      await req.audit(accion, 'licenciamedica', pl, { userId: actorId });
    } catch (e) {
      console.warn('[audit] decidirLicencia:', e?.message || e);
    }

    return res.status(200).json({
      ok: true,
      data: {
        id_licencia: idLicencia,
        estado: out?.estado ?? decisionRaw,
        motivo_rechazo: decisionRaw === 'rechazado' ? (motivo_rechazo ?? null) : null
      }
    });
  } catch (err) {
    const code = err?.http ?? (
      /no encontrada/i.test(err?.message) ? 404 :
      /ya fue/i.test(err?.message)        ? 409 :
      /rango|fech/i.test(err?.message)    ? 422 :
      /solapa/i.test(err?.message)        ? 422 :
      /hash/i.test(err?.message)          ? 422 :
      500
    );

    const mapMsg = {
      LICENCIA_NO_ENCONTRADA: 'La licencia no existe',
      ESTADO_NO_PERMITE_DECIDIR: 'El estado actual no permite decidir',
      LICENCIA_SIN_HASH: 'No se puede aceptar sin archivo válido (hash)',
      RANGO_FECHAS_INVALIDO: 'Rango de fechas inválido',
      SOLAPAMIENTO_CON_OTRA_ACEPTADA: 'Se solapa con otra licencia aceptada',
      DECISION_INVALIDA: 'Decision inválida'
    };

    const msg = mapMsg[err?.message] ?? (err?.message || 'Error al decidir licencia');
    return res.status(code).json({ ok: false, error: msg });
  }
}

// ========================
// GET /api/licencias/:id/archivo
// → Devuelve URL firmada temporal de Supabase
// ========================
export const descargarArchivoLicencia = async (req, res) => {
  try {
    const idLicencia = Number(req.params.id || 0);
    const usuario = req.user || null;

    if (!usuario) return res.status(403).json({ ok: false, error: 'Token requerido o inválido' });
    if (!Number.isInteger(idLicencia) || idLicencia <= 0)
      return res.status(400).json({ ok: false, error: 'ID de licencia inválido' });

    // Tomar última versión del archivo
    const [rows] = await db.execute(`
      SELECT a.id_archivo, a.ruta_url, a.tipo_mime, a.tamano, a.fecha_subida,
             l.id_usuario
        FROM archivolicencia a
        JOIN licenciamedica l ON l.id_licencia = a.id_licencia
       WHERE a.id_licencia = ?
       ORDER BY a.id_archivo DESC
       LIMIT 1
    `, [idLicencia]);

    if (!rows.length) {
      return res.status(404).json({
        ok: false,
        code: "ARCHIVO_NO_ENCONTRADO",
        error: "No se encontró ningún archivo para la licencia especificada."
      });
    }

    const archivo = rows[0];

    // Permisos (propietario, funcionario, secretario)
    const rol = String(usuario.rol || '').toLowerCase();
    const esDueno = Number(usuario.id_usuario) === Number(archivo.id_usuario);
    const esFunc = ['funcionario', 'secretario'].includes(rol);
    if (!esDueno && !esFunc) {
      return res.status(403).json({ ok: false, error: 'No autorizado' });
    }

    // Solo soportamos ruta interna de Supabase (path relativo al bucket)
    const ruta = String(archivo.ruta_url || '');
    // Si por legacy quedó una http/https/local, avisamos:
    if (ruta.startsWith('http://') || ruta.startsWith('https://') || ruta.startsWith('local://')) {
      return res.status(409).json({
        ok: false,
        error: 'Ruta no compatible (legacy). Vuelve a cargar el PDF para migrarlo a Storage.'
      });
    }

    // Crear URL firmada (60s)
    const url = await crearUrlFirmada(ruta, 60);

    return res.json({
      ok: true,
      url,
      mime: archivo.tipo_mime || 'application/pdf',
      expires_in: 60
    });
  } catch (e) {
    console.error('❌ [licencias:descargarArchivoLicencia] error:', e);
    return res.status(500).json({ ok: false, error: 'Error generando URL firmada' });
  }
};
// Agregar en backend/controllers/licencias.controller.js

/**
 * Verificar si el estudiante está matriculado en los cursos seleccionados
 */
async function verificarMatriculasActivas(idUsuario, cursosSeleccionados) {
  try {
    if (!Array.isArray(cursosSeleccionados) || cursosSeleccionados.length === 0) {
      throw new Error('No se han seleccionado cursos');
    }

    // Obtener IDs de cursos únicos
    const idsCursos = [...new Set(cursosSeleccionados.map(id => parseInt(id)))];
    
    const [matriculas] = await db.execute(
      `SELECT m.id_matricula, c.id_curso, c.codigo, c.nombre_curso
       FROM matriculas m
       JOIN curso c ON m.id_curso = c.id_curso
       WHERE m.id_usuario = ? 
         AND c.id_curso IN (${idsCursos.map(() => '?').join(',')})
         AND c.activo = 1`,
      [idUsuario, ...idsCursos]
    );

    // Verificar que todos los cursos seleccionados tengan matrícula activa
    const cursosConMatricula = matriculas.map(m => m.id_curso);
    const cursosSinMatricula = idsCursos.filter(id => !cursosConMatricula.includes(id));

    if (cursosSinMatricula.length > 0) {
      // Obtener nombres de cursos sin matrícula para el mensaje de error
      const [cursosNoMatriculados] = await db.execute(
        `SELECT id_curso, codigo, nombre_curso 
         FROM curso 
         WHERE id_curso IN (${cursosSinMatricula.map(() => '?').join(',')})`,
        cursosSinMatricula
      );

      const nombresCursos = cursosNoMatriculados.map(c => `${c.codigo} - ${c.nombre_curso}`).join(', ');
      throw new Error(`No estás matriculado en los siguientes cursos: ${nombresCursos}`);
    }

    return matriculas;
  } catch (error) {
    console.error('❌ Error en verificarMatriculasActivas:', error);
    throw error;
  }
}
// =====================================================
// ⬅️ Restaurado: cambiarEstado (named export)
// =====================================================
export async function cambiarEstado(req, res, next) {
  try {
    const { id } = req.params;
    const { nuevo_estado, motivo_rechazo } = req.body;

    if (!['aceptado','rechazado','pendiente'].includes(nuevo_estado)) {
      return res.status(400).json({ error: 'ESTADO_INVALIDO' });
    }

    // ✅ permitir funcionario y secretario
    if (!['funcionario','secretario'].includes(String(req.user?.rol || '').toLowerCase())) {
      return res.status(403).json({ error: 'NO_AUTORIZADO' });
    }

    const lic = await LicenciaMedica.findByPk(id);
    if (!lic) return res.status(404).json({ error: 'LICENCIA_NO_ENCONTRADA' });

    const anterior = lic.estado;
    lic.estado = nuevo_estado;
    if (nuevo_estado === 'rechazado') {
      lic.motivo_rechazo = motivo_rechazo ?? lic.motivo_rechazo;
    }

    await lic.save({ userId: req.user?.id_usuario ?? req.user?.id ?? null });

    if (nuevo_estado === 'aceptado' || nuevo_estado === 'rechazado') {
      try {
        const accion = nuevo_estado === 'aceptado' ? 'aceptar licencia' : 'rechazar licencia';
        await req.audit(accion, 'licenciamedica', {
          id_licencia: lic.id_licencia,
          estado_nuevo: nuevo_estado,
          ...(nuevo_estado === 'rechazado' ? { motivo_rechazo: lic.motivo_rechazo ?? motivo_rechazo ?? null } : {})
        });
      } catch (e) {
        console.warn('[audit] cambiarEstado:', e?.message || e);
      }
    }

    return res.json({ ok: true, data: { id: lic.id_licencia, estado: lic.estado } });
  } catch (err) { next(err); }
}

/**
 * Obtener licencias de un estudiante con información de regularidad
 * (Para uso de profesores/administradores)
 */
export const getLicenciasEstudianteConRegularidad = async (req, res) => {
  try {
    const { idEstudiante } = req.params;
    const { periodo, id_curso } = req.query;

    // Validar permisos - SOLO profesor o administrador
    const rol = (req.user?.rol ?? req.rol ?? '').toString().toLowerCase();
    if (!['profesor', 'administrador'].includes(rol)) {
      return res.status(403).json({ 
        ok: false, 
        error: 'No tiene permisos para ver esta información. Se requiere rol de profesor o administrador.' 
      });
    }

    // Si es profesor, verificar que el estudiante esté en sus cursos
    if (rol === 'profesor') {
      const [acceso] = await db.execute(`
        SELECT 1 
        FROM matriculas m
        JOIN curso c ON m.id_curso = c.id_curso
        WHERE m.id_usuario = ? 
          AND c.id_usuario = ?
        LIMIT 1
      `, [idEstudiante, req.user.id_usuario]);
      
      if (acceso.length === 0) {
        return res.status(403).json({ 
          ok: false, 
          error: 'No tiene acceso a la información de este estudiante' 
        });
      }
    }

    // Obtener licencias del estudiante
    const [licencias] = await db.execute(`
      SELECT 
        lm.id_licencia,
        lm.folio,
        lm.fecha_emision,
        lm.fecha_inicio,
        lm.fecha_fin,
        lm.estado,
        lm.motivo_rechazo,
        c.nombre_curso,
        c.codigo,
        c.periodo
      FROM licenciamedica lm
      LEFT JOIN licencias_entregas le ON lm.id_licencia = le.id_licencia
      LEFT JOIN curso c ON le.id_curso = c.id_curso
      WHERE lm.id_usuario = ?
        AND (? IS NULL OR c.periodo = ?)
        AND (? IS NULL OR le.id_curso = ?)
      ORDER BY lm.fecha_creacion DESC
    `, [idEstudiante, periodo, periodo, id_curso, id_curso]);

    // Calcular regularidad
    const regularidad = await calcularRegularidadEstudiante(
      parseInt(idEstudiante), 
      periodo, 
      id_curso ? parseInt(id_curso) : null
    );

    // Obtener información del estudiante
    const [estudianteInfo] = await db.execute(
      'SELECT id_usuario, nombre, correo_usuario FROM usuario WHERE id_usuario = ?',
      [idEstudiante]
    );

    return res.status(200).json({
      ok: true,
      data: {
        estudiante: estudianteInfo[0] || null,
        licencias,
        regularidad
      }
    });
  } catch (error) {
    console.error('❌ Error en getLicenciasEstudianteConRegularidad:', error);
    return res.status(500).json({ 
      ok: false, 
      error: 'Error interno del servidor' 
    });
  }
};

export default {
  listarLicencias,
  listarMisLicencias,
  crearLicencia,
  crearLicenciaLegacy,
  getLicenciasEnRevision,
  detalleLicencia,
  decidirLicencia,
  descargarArchivoLicencia,
  licenciasResueltas,
  cambiarEstado, // ← también en el default por si acaso
};