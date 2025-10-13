// backend/controllers/licencias.controller.js  (ESM unificado)
import crypto from 'crypto';
import db from '../config/db.js'; // ← ajusta la ruta si corresponde
import { decidirLicenciaSvc } from '../services/servicio_Licencias.js';
import fs from 'fs';
import path from 'path';
import http from 'http';
import https from 'https';

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
  if (rol === 'funcionario') return true;
  if (rol === 'estudiante' && Number(user.id_usuario) === Number(idPropietario)) return true;
  return false;
}

// ===============================================
// GET: listar licencias del usuario autenticado
// ===============================================
export const listarLicencias = async (req, res) => {
  try {
    const usuarioId = req.user?.id_usuario ?? req.id ?? null;
    if (!usuarioId) return res.status(401).json({ ok: false, error: 'No autenticado' });

    // Paginación opcional (por si luego la usas en la tabla)
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize || '50', 10)));
    const offset = (page - 1) * pageSize;

    const [rows] = await db.execute(
      `
      SELECT
        id_licencia           AS id,
        DATE_FORMAT(fecha_emision, '%Y-%m-%d') AS fecha_emision,
        estado
      FROM LicenciaMedica
      WHERE id_usuario = ?
      ORDER BY fecha_emision DESC, id_licencia DESC
      LIMIT ? OFFSET ?
      `,
      [usuarioId, pageSize, offset]
    );

    // total para meta (no imprescindible si no quieres)
    const [countRows] = await db.execute(
      `SELECT COUNT(*) AS total FROM LicenciaMedica WHERE id_usuario = ?`,
      [usuarioId]
    );
    const total = countRows?.[0]?.total ?? 0;

    return res.json({
      ok: true,
      data: rows,               
      meta: { total, page, pageSize }
    });
  } catch (error) {
    console.error('[licencias:listarLicencias] error:', error);
    return res.status(500).json({ ok: false, error: 'Error al listar licencias' });
  }
};

// =====================================================
// POST: crear licencia (con validaciones reales)
// =====================================================

function validarCampoFecha(fechaStr, campo = 'fecha') {
  const normalizada = String(fechaStr ?? '').trim();

  // Rechazar si está vacío o es el placeholder
  if (!normalizada || normalizada === 'dd-mm-aaaa') {
    return `${campo} es obligatorio.`;
  }

  return null; // Sin errores
}



export const crearLicencia = async (req, res) => {
  try {
    const usuarioId = req.user?.id_usuario ?? req.id ?? null;
    const rol = (req.user?.rol ?? req.rol ?? '').toString().toLowerCase();

    if (!usuarioId) {
      return res.status(401).json({ msg: 'No autenticado' });
    }
    if (rol && rol !== 'estudiante') {
      return res.status(403).json({ msg: 'Solo estudiantes pueden crear licencias' });
    }

    const errores = [];

    const errorInicio = validarCampoFecha(req.body.fecha_inicio, 'fecha_inicio');
    if (errorInicio) errores.push(errorInicio);

    const errorFin = validarCampoFecha(req.body.fecha_fin, 'fecha_fin');
    if (errorFin) errores.push(errorFin);

    if (errores.length > 0) {
      return res.status(400).json({ ok: false, error: errores.join(' ') });
    }

    const { fecha_inicio, fecha_fin, motivo } = req.body || {};
    const isISO = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d);

    if (!isISO(fecha_inicio) || !isISO(fecha_fin)) {
      return res.status(400).json({ msg: 'fecha_inicio/fecha_fin deben ser DD-MM-AAAA' });
    }
    if (new Date(fecha_inicio) > new Date(fecha_fin)) {
      return res.status(400).json({ msg: 'La fecha de inicio no puede ser posterior a la fecha fin' });
    }

    // --------- VALIDAR FECHAS SUPERPUESTAS (bloqueante) ----------
    const [solape] = await db.execute(
      `SELECT id_licencia, fecha_inicio, fecha_fin, estado
         FROM LicenciaMedica
        WHERE id_usuario = ?
          AND estado IN ('pendiente','aceptado')
          AND (? <= fecha_fin AND ? >= fecha_inicio)
        LIMIT 1`,
      [usuarioId, fecha_inicio, fecha_fin]
    );

    if (solape.length) {
      const lic = solape[0];
      return res.status(409).json({
        ok: false,
        code: 'LICENCIA_FECHAS_SUPERPUESTAS',
        error: `Fechas superpuestas con licencia #${lic.id_licencia} (${lic.fecha_inicio} a ${lic.fecha_fin}, estado: ${lic.estado}).`
      });
    }

    // --------- VALIDAR HASH DUPLICADO (si tenemos archivo o hash) ----------
    const archivo = req.file ?? null;
    // Puedes mandar 'hash' en body o lo calculamos del archivo subido
    let hashEntrada = req.body?.hash ?? null;
    if (!hashEntrada && archivo?.buffer) {
      hashEntrada = sha256FromBuffer(archivo.buffer);
    }

    if (hashEntrada) {
      const [dup] = await db.execute(
        `SELECT al.id_archivo, lm.id_licencia
           FROM ArchivoLicencia al
           JOIN LicenciaMedica lm ON lm.id_licencia = al.id_licencia
          WHERE lm.id_usuario = ? AND al.hash = ?
          LIMIT 1`,
        [usuarioId, hashEntrada]
      );
      if (dup.length) {
        return res.status(409).json({
          ok: false,
          code: 'ARCHIVO_HASH_DUPLICADO',
          error: `Este archivo ya fue usado en la licencia #${dup[0].id_licencia}.`
        });
      }
    }

    // --------- Insertar licencia ----------
    const [u] = await db.execute('SELECT id_usuario FROM Usuario WHERE id_usuario = ?', [usuarioId]);
    if (!u.length) return res.status(404).json({ msg: 'Usuario no encontrado' });

    // folio obligatorio: usar exactamente lo que envía el usuario
    const folio = String(req.body?.folio ?? "").trim();
    if (!folio) {
      return res.status(400).json({ msg: "El folio es obligatorio" });
    }

    // ahora usar `folio` al crear el registro en licenciamedica
    const sqlInsert = `
      INSERT INTO LicenciaMedica
        (folio, fecha_emision, fecha_inicio, fecha_fin, estado, motivo_rechazo, fecha_creacion, id_usuario)
      VALUES
        (?,     CURDATE(),     ?,            ?,          'pendiente', NULL,            CURDATE(),     ?)
    `;
    const [result] = await db.execute(sqlInsert, [folio, fecha_inicio, fecha_fin, usuarioId]);

    // --------- Notificación (best-effort) ----------
    try {
      const asunto = 'creacion de licencia';
      const contenido = `Se ha creado la licencia ${folio} con fecha de inicio ${fecha_inicio} y fin ${fecha_fin}.`;
      await db.execute(
        `INSERT INTO notificacion (asunto, contenido, leido, fecha_envio, id_usuario)
         VALUES (?, ?, 0, NOW(), ?)`,
        [asunto, contenido, usuarioId]
      );
      console.log(`🔔 [NOTIFICACIÓN] Usuario ${usuarioId} recibió: "${asunto}" → ${contenido}`);
    } catch (notifError) {
      console.warn('⚠️ No se pudo registrar la notificación:', notifError.message);
    }



    // --------- Registrar archivo (opcional) ----------
    try {
      const idLicencia = result.insertId;

      // En tu tabla archivolicencia: ruta_url NOT NULL
      // Si subes archivo pero aún no tienes URL real, guardamos un placeholder.
      const ruta_url = req.body?.ruta_url ?? (archivo ? 'local://sin-url' : null);
      const tipo_mime = req.body?.tipo_mime ?? (archivo?.mimetype ?? null);
      const tamano = Number(req.body?.tamano ?? (archivo?.size ?? 0));

      // Si tenemos al menos hash/URL/mime/tamaño y licencia, insertamos
      if ((hashEntrada || ruta_url || tipo_mime || tamano) && ruta_url) {
        await db.execute(
          `INSERT INTO ArchivoLicencia (ruta_url, tipo_mime, hash, tamano, fecha_subida, id_licencia)
           VALUES (?, ?, ?, ?, NOW(), ?)`,
          [ruta_url, tipo_mime ?? 'application/octet-stream', hashEntrada ?? null, tamano, idLicencia]
        );
        console.log(`📎 [ARCHIVO] Registrado para licencia ${idLicencia}${archivo?.originalname ? `: ${archivo.originalname}` : ''}`);
      } else if (archivo || hashEntrada) {
        console.warn('⚠️ Archivo no registrado: faltan campos (ej. ruta_url)');
      }
    } catch (archivoError) {
      console.error('❌ Error al registrar archivo:', archivoError.message);
    }

    return res.status(201).json({
      msg: 'Licencia creada con éxito',
      licencia: {
        id_licencia: result.insertId,
        folio,
        fecha_emision: new Date().toISOString().slice(0, 10),
        fecha_inicio,
        fecha_fin,
        estado: 'pendiente',
        motivo_rechazo: null,
        fecha_creacion: new Date().toISOString().slice(0, 10),
        id_usuario: usuarioId,
        motivo // lo devolvemos en la respuesta si lo enviaste
      }
    });
  } catch (error) {
    console.error('[licencias:crearLicencia] error:', error);
    return res.status(500).json({ msg: 'Error al crear la licencia' });
  }
};

export const getLicenciasEnRevision = async (req, res) => {
  try {
    const usuarioId = req.user?.id_usuario ?? req.id ?? null;
    const rol = (req.user?.rol ?? req.rol ?? '').toString().toLowerCase();

    if (!usuarioId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    // Filtros
    const { nombre, folio, desde, hasta } = req.query;
    let condiciones = [`estado = 'pendiente'`];
    let params = [];

    if (rol === 'funcionario' || rol === 'secretario' || rol === 'profesor') {
      // Filtros avanzados solo para funcionarios/secretarios/profesores
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
    const limit = parseInt(req.query.limit) || 10;
    const offset = ((parseInt(req.query.page) || 1) - 1) * limit;

    const [rows] = await db.execute(`
      SELECT lm.id_licencia, lm.folio, lm.fecha_emision, lm.fecha_inicio, lm.fecha_fin, lm.estado, lm.motivo_rechazo, lm.fecha_creacion, lm.id_usuario, u.nombre
      FROM LicenciaMedica lm
      JOIN Usuario u ON lm.id_usuario = u.id_usuario
      ${where}
      ORDER BY lm.fecha_emision DESC, lm.id_licencia DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    return res.json({
      msg: 'Licencias en revisión',
      usuarioId,
      rol,
      data: rows,
    });
  } catch (error) {
    console.error('[licencias:getLicenciasEnRevision] error:', error);
    return res.status(500).json({ error: 'Error al obtener licencias en revisión' });
  }
};

export const licenciasResueltas = async (req, res) => {
  try {
    const rol = (req.user?.rol ?? req.rol ?? '').toString().toLowerCase();
    if (rol !== 'funcionario') {
      return res.status(403).json({ ok: false, error: 'Solo los funcionarios pueden ver esta lista.' });
    }

    const { estado, desde, hasta, nombre, folio, page = 1, limit = 20 } = req.query;

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
    const lim = Math.max(1, Math.min(100, parseInt(limit)));
    const off = (Math.max(1, parseInt(page)) - 1) * lim;

    const [licencias] = await db.execute(`
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
      JOIN usuario u ON lm.id_usuario = u.id_usuario
      ${where}
      ORDER BY lm.fecha_creacion DESC
      LIMIT ? OFFSET ?
    `, [...valores, lim, off]);

    return res.status(200).json({ licencias });
  } catch (error) {
    console.error('❌ Error al obtener licencias resueltas:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const detalleLicencia = async (req, res) => {
  try {
    const usuarioId = req.user?.id_usuario ?? req.id ?? null;
    const rol = (req.user?.rol ?? req.rol ?? '').toString().toLowerCase();
    const idLicencia = Number(req.params.id);

    if (!usuarioId) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    if (!idLicencia) {
      return res.status(400).json({ error: 'ID de licencia inválido' });
    }

    let sql, params;
    if (rol === 'funcionario') {
      sql = `
        SELECT
          lm.id_licencia, lm.folio, lm.fecha_emision, lm.fecha_inicio, lm.fecha_fin, lm.estado,
          lm.motivo_rechazo, lm.fecha_creacion,
          u.id_usuario, u.nombre, u.correo_usuario, u.id_rol,
          al.id_archivo, al.ruta_url, al.tipo_mime, al.hash, al.tamano, al.fecha_subida
        FROM LicenciaMedica lm
        JOIN Usuario u ON lm.id_usuario = u.id_usuario
        LEFT JOIN ArchivoLicencia al ON al.id_licencia = lm.id_licencia
        WHERE lm.id_licencia = ?
      `;
      params = [idLicencia];
    } else {
      sql = `
        SELECT
          lm.id_licencia, lm.folio, lm.fecha_emision, lm.fecha_inicio, lm.fecha_fin, lm.estado,
          lm.motivo_rechazo, lm.fecha_creacion,
          u.id_usuario, u.nombre, u.correo_usuario, u.id_rol,
          al.id_archivo, al.ruta_url, al.tipo_mime, al.hash, al.tamano, al.fecha_subida
        FROM LicenciaMedica lm
        JOIN Usuario u ON lm.id_usuario = u.id_usuario
        LEFT JOIN ArchivoLicencia al ON al.id_licencia = lm.id_licencia
        WHERE lm.id_licencia = ? AND lm.id_usuario = ?
      `;
      params = [idLicencia, usuarioId];
    }

    const [rows] = await db.execute(sql, params);
    if (!rows.length) {
      return res.status(404).json({ error: 'Licencia no encontrada o sin permiso' });
    }
    return res.json({ detalle: rows });
  } catch (error) {
    console.error('[licencias:detalleLicencia] error:', error);
    return res.status(500).json({ error: 'Error al obtener detalle de licencia' });
  }
};

// =====================================================
// POST (legacy): versión original con validaciones básicas
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

    // verificar usuario
    const [u] = await db.execute('SELECT id_usuario FROM Usuario WHERE id_usuario = ?', [id_usuario]);
    if (!u.length) return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado' });

    const folio = String(req.body?.folio ?? "").trim();
    if (!folio) {
      return res.status(400).json({ ok: false, mensaje: "El folio es obligatorio" });
    }

    const sql = `
      INSERT INTO LicenciaMedica
        (folio, fecha_emision, fecha_inicio, fecha_fin, estado, motivo_rechazo, fecha_creacion, id_usuario)
      VALUES
        (?,     CURDATE(),     ?,            ?,          'pendiente', NULL,            CURDATE(),     ?)
    `;
    const [result] = await db.execute(sql, [folio, fecha_inicio, fecha_fin, id_usuario]);

    const [row] = await db.execute(
      'SELECT id_licencia, folio, fecha_emision, fecha_inicio, fecha_fin, estado, motivo_rechazo, fecha_creacion, id_usuario FROM LicenciaMedica WHERE id_licencia = ?',
      [result.insertId]
    );

    return res.status(201).json({ ok: true, mensaje: 'Licencia creada', data: row[0] });
  } catch (e) {
    console.error('❌ [licencias:crearLicenciaLegacy] error:', e);
    return res.status(500).json({ ok: false, mensaje: 'Error creando licencia', detalle: e.message });
  }
};

// === Controller: decidirLicencia (sin check de rol: lo hace el router con tieneRol('secretaria'))
export async function decidirLicencia(req, res) {
  try {
    const idLicencia   = Number(req.params.id);
    const idfuncionario = req.user?.id_usuario ?? null;
    const actorId = req.user?.id_usuario ?? null;

    if (!idfuncionario) {
      return res.status(401).json({ ok: false, error: 'No autenticado' });
    }
    if (!idLicencia) {
      return res.status(400).json({ ok: false, error: 'ID de licencia inválido' });
    }

    // Normalización de entrada
    const decisionRaw = String(req.body.decision ?? req.body.estado ?? '').toLowerCase();
    if (!['aceptado', 'rechazado'].includes(decisionRaw)) {
      return res.status(422).json({ ok: false, error: 'Decision inválida' });
    }

    // Si es rechazo, motivo obligatorio (≥10)
    const motivo_rechazo = req.body.motivo_rechazo ?? null;
    if (decisionRaw === 'rechazado') {
      const motivoOk = typeof motivo_rechazo === 'string' && motivo_rechazo.trim().length >= 10;
      if (!motivoOk) {
        return res.status(400).json({ ok: false, error: 'motivo_rechazo es obligatorio (≥10 caracteres)' });
      }
    }

    // Fechas (_fi/_ff) si “aceptado” ya deberían venir validadas por tu middleware validateDecision (si lo usas)
    const payload = {
      idLicencia,
      decision: decisionRaw,            // 'aceptado' | 'rechazado'
      estado: decisionRaw,              // compat
      motivo_rechazo: motivo_rechazo ?? null,
      observacion: req.body.observacion ?? null,
      _fi: req.body._fi,
      _ff: req.body._ff,

      // 🔧 CLAVE: mandamos el id del revisor en los dos nombres posibles
      idFuncionario: actorId,
      idfuncionario: actorId,
      id_usuario: actorId           // ← muchos services/grabadores de historial esperan este nombre
    };

    const out = await decidirLicenciaSvc(payload);

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
// ========================
export const descargarArchivoLicencia = async (req, res) => {
  try {
    const idLicencia = Number(req.params.id || 0);
    const usuario = req.user || null;

    // DoD: si no hay token válido → 403 (si tu middleware ya hace 403, esto apenas se usará)
    if (!usuario) return res.status(403).json({ ok: false, error: 'Token requerido o inválido' });
    if (!Number.isInteger(idLicencia) || idLicencia <= 0)
      return res.status(400).json({ ok: false, error: 'ID de licencia inválido' });

    // Nota: uso nombres de tabla en minúscula para evitar issues en sistemas sensibles a mayúsculas
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
        error: true,
        code: "ARCHIVO_NO_ENCONTRADO",
        message: "No se encontró ningún archivo para la licencia especificada.",
        hint: "Verifica que el ID de licencia exista y tenga archivos asociados.",
        timestamp: new Date().toISOString()
      });
    }

    const archivo = rows[0];

    if (!_puedeVerArchivo(usuario, archivo.id_usuario))
      return res.status(403).json({ ok: false, error: 'No autorizado' });

    const filename = _filenameFromRuta(archivo.ruta_url);
    const contentType = archivo.tipo_mime || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    // Si quieres ver PDF embebido, cambia "attachment" por "inline" cuando sea application/pdf
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');

    const baseLocal = process.env.STORAGE_LOCAL_BASE || 'uploads';
    const ruta = String(archivo.ruta_url || '');

    // Soporte http(s):// como proxy
    if (ruta.startsWith('http://') || ruta.startsWith('https://')) {
      const client = ruta.startsWith('https://') ? https : http;
      client.get(ruta, (up) => {
        if ((up.statusCode || 500) >= 400) {
          res.status(up.statusCode || 502).end();
          return;
        }
        up.pipe(res);
      }).on('error', () => res.status(502).json({ ok: false, error: 'Error al obtener archivo remoto' }));
      return;
    }

    // Soporte local:// y rutas relativas
    let absPath;
    if (ruta.startsWith('local://')) {
      const key = ruta.slice('local://'.length);
      absPath = _safeJoin(baseLocal, key);
    } else if (!ruta.startsWith('/')) {
      absPath = _safeJoin(baseLocal, ruta);
    } else {
      return res.status(400).json({ ok: false, error: 'Esquema de ruta no soportado' });
    }

    if (!fs.existsSync(absPath))
      return res.status(404).json({ ok: false, error: 'Archivo físico no existe' });

    fs.createReadStream(absPath).pipe(res);
  } catch (e) {
    if (e.code === 'E_PATH_TRAVERSAL')
      return res.status(400).json({ ok: false, error: 'Ruta inválida' });
    console.error('❌ [licencias:descargarArchivoLicencia] error:', e);
    return res.status(500).json({ ok: false, error: 'Error interno' });
  }
};


export default {
  listarLicencias,
  crearLicencia,
  crearLicenciaLegacy,
  getLicenciasEnRevision,
  detalleLicencia,
  decidirLicencia,
  descargarArchivoLicencia,
  licenciasResueltas,
}
