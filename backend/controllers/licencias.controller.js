// backend/controllers/licencias.controller.js  (ESM unificado)
import crypto from 'crypto';
import LicenciaMedica from '../src/models/modelo_LicenciaMedica.js';
import db from '../config/db.js';
import { decidirLicenciaSvc } from '../services/servicio_Licencias.js';
import fs from 'fs';
import path from 'path';
import http from 'http';
import https from 'https';

// ✉️ Servicio de correos (solo para "nueva licencia")
import { notificarNuevaLicencia } from '../services/servicio_Correo.js';

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

// =======================================================
// ✅ NUEVO CONTROLADOR: GET /api/licencias/mis-licencias
// =======================================================
export async function listarMisLicencias(req, res) {
  try {
    const idUsuario = req.user?.id_usuario ?? req.user?.id ?? null;
    if (!idUsuario) {
      return res.status(401).json({ ok: false, error: 'Usuario no autenticado' });
    }

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
      FROM LicenciaMedica
      WHERE id_usuario = ?
      ORDER BY fecha_creacion DESC
      `,
      [idUsuario]
    );

    return res.status(200).json({ ok: true, data: rows });
  } catch (error) {
    console.error('❌ [listarMisLicencias] error:', error);
    return res.status(500).json({
      ok: false,
      error: 'Error interno al obtener licencias del estudiante',
    });
  }
}

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
      FROM LicenciaMedica
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
  try {
    const usuarioId = req.user?.id_usuario ?? req.id ?? null;
    const rol = (req.user?.rol ?? req.rol ?? '').toString().toLowerCase();

    // ✉️ obtener también correo para el mail
    const [userRow] = await db.execute(
      'SELECT nombre, correo_usuario AS correo FROM Usuario WHERE id_usuario = ?',
      [usuarioId]
    );
    const nombreEstudiante = userRow[0]?.nombre || usuarioId;
    const correoEstudiante = userRow[0]?.correo || null;

    if (!usuarioId) return res.status(401).json({ msg: 'No autenticado' });
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
      return res.status(400).json({ msg: 'fecha_inicio/fecha_fin deben ser YYYY-MM-DD' });
    }
    if (new Date(fecha_inicio) > new Date(fecha_fin)) {
      return res.status(400).json({ msg: 'La fecha de inicio no puede ser posterior a la fecha fin' });
    }

    // Superposición de fechas
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

    // Duplicado por hash
    const archivo = req.file ?? null;
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

    // Insert
    const [u] = await db.execute('SELECT id_usuario FROM Usuario WHERE id_usuario = ?', [usuarioId]);
    if (!u.length) return res.status(404).json({ msg: 'Usuario no encontrado' });

    const folio = String(req.body?.folio ?? '').trim();
    if (!folio) return res.status(400).json({ msg: 'El folio es obligatorio' });

    const [result] = await db.execute(
      `INSERT INTO LicenciaMedica
       (folio, fecha_emision, fecha_inicio, fecha_fin, estado, motivo_rechazo, fecha_creacion, id_usuario)
       VALUES (?, CURDATE(), ?, ?, 'pendiente', NULL, CURDATE(), ?)`,
      [folio, fecha_inicio, fecha_fin, usuarioId]
    );

    // Notificaciones (best-effort en BD)
    try {
      const asunto = 'creacion de licencia';
      const contenido = `Se ha creado la licencia ${folio} con fecha de inicio ${fecha_inicio} y fin ${fecha_fin}.`;
      await db.execute(
        `INSERT INTO notificacion (asunto, contenido, leido, fecha_envio, id_usuario)
         VALUES (?, ?, 0, NOW(), ?)`,
        [asunto, contenido, usuarioId]
      );
    } catch {}

    // Archivo (opcional)
    try {
      const idLicencia = result.insertId;
      const ruta_url = req.body?.ruta_url ?? (archivo ? 'local://sin-url' : null);
      const tipo_mime = req.body?.tipo_mime ?? (archivo?.mimetype ?? null);
      const tamano = Number(req.body?.tamano ?? (archivo?.size ?? 0));
      if ((hashEntrada || ruta_url || tipo_mime || tamano) && ruta_url) {
        await db.execute(
          `INSERT INTO ArchivoLicencia (ruta_url, tipo_mime, hash, tamano, fecha_subida, id_licencia)
           VALUES (?, ?, ?, ?, NOW(), ?)`,
          [ruta_url, tipo_mime ?? 'application/octet-stream', hashEntrada ?? null, tamano, idLicencia]
        );
      }
    } catch (archivoError) {
      console.error('❌ Error al registrar archivo:', archivoError.message);
    }

    // ✉️ Enviar correo a TODOS los funcionarios (id_rol=3, activos) — SIN usar SECRETARIA_EMAILS
    try {
      const idLicencia = result.insertId;

      // 1) Leer correos de funcionarios activos
      const [destRows] = await db.execute(
        `SELECT correo_usuario AS correo
           FROM Usuario
          WHERE id_rol = 3 AND activo = 1 AND correo_usuario IS NOT NULL`
      );

      const destinatarios = Array.isArray(destRows)
        ? [...new Set(destRows.map(r => (r.correo || '').trim()).filter(Boolean))]
        : [];

      console.log('✉️ Funcionarios destino:', destinatarios);

      if (!destinatarios.length) {
        console.warn('✉️ [crearLicencia] No hay funcionarios (id_rol=3) activos con correo; correo omitido.');
      } else {
        const enlaceDetalle = `${process.env.APP_BASE_URL || 'http://localhost:5173'}/licencias/${idLicencia}`;

        await notificarNuevaLicencia({
          folio,
          estudiante: { nombre: nombreEstudiante, correo: correoEstudiante },
          fechaCreacionISO: new Date().toISOString(),
          enlaceDetalle,
          to: destinatarios, // ← lista dinámica, evita fallback
        }).then(r => {
          if (!r?.ok) console.error('✉️ Email nueva licencia falló:', r?.error);
        });
      }
    } catch (e) {
      console.warn('✉️ [crearLicencia] envío correo omitido:', e?.message || e);
    }

    return res.status(201).json({
      ok: true,
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
        motivo
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

    const { nombre, folio, desde, hasta } = req.query;
    let condiciones = [`estado = 'pendiente'`];
    let params = [];

    if (['funcionario', 'secretario', 'profesor'].includes(rol)) {
      if (nombre) { condiciones.push(`u.nombre LIKE ?`); params.push(`%${nombre}%`); }
      if (folio) { condiciones.push(`lm.folio LIKE ?`); params.push(`%${folio}%`); }
      if (desde) { condiciones.push(`lm.fecha_emision >= ?`); params.push(desde); }
      if (hasta) { condiciones.push(`lm.fecha_emision <= ?`); params.push(hasta); }
    } else {
      condiciones.push(`lm.id_usuario = ?`);
      params.push(usuarioId);
    }

    const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
    const limit = parseInt(req.query.limit) || 10;
    const offset = ((parseInt(req.query.page) || 1) - 1) * limit;

    const [rows] = await db.execute(`
      SELECT lm.id_licencia, lm.folio, lm.fecha_emision, lm.fecha_inicio, lm.fecha_fin,
             lm.estado, lm.motivo_rechazo, lm.fecha_creacion, lm.id_usuario, u.nombre
      FROM LicenciaMedica lm
      JOIN Usuario u ON lm.id_usuario = u.id_usuario
      ${where}
      ORDER BY lm.fecha_emision DESC, lm.id_licencia DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    return res.status(200).json({ ok: true, data: rows, meta: { page: Number(req.query.page) || 1, limit } });
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
    if (rol !== 'funcionario')
      return res.status(403).json({ ok: false, error: 'Solo los funcionarios pueden ver esta lista.' });

    const { estado, desde, hasta, nombre, folio, page = 1, limit = 20 } = req.query;
    let condiciones = [`lm.estado IN ('aceptado', 'rechazado')`];
    let valores = [];

    if (estado && ['aceptado', 'rechazado'].includes(estado)) { condiciones.push(`lm.estado = ?`); valores.push(estado); }
    if (nombre) { condiciones.push(`u.nombre LIKE ?`); valores.push(`%${nombre}%`); }
    if (folio) { condiciones.push(`lm.folio LIKE ?`); valores.push(`%${folio}%`); }
    if (desde) { condiciones.push(`lm.fecha_emision >= ?`); valores.push(desde); }
    if (hasta) { condiciones.push(`lm.fecha_emision <= ?`); valores.push(hasta); }

    const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
    const lim = Math.max(1, Math.min(100, parseInt(limit)));
    const off = (Math.max(1, parseInt(page)) - 1) * lim;

    const [rows] = await db.execute(`
      SELECT lm.id_licencia, lm.folio, lm.fecha_emision, lm.fecha_inicio, lm.fecha_fin,
             lm.estado, lm.motivo_rechazo, lm.fecha_creacion, lm.id_usuario, u.nombre
      FROM licenciamedica lm
      JOIN usuario u ON lm.id_usuario = u.id_usuario
      ${where}
      ORDER BY lm.fecha_creacion DESC
      LIMIT ? OFFSET ?
    `, [...valores, lim, off]);

    return res.status(200).json({ ok: true, data: rows, meta: { page: Number(page), limit: lim } });
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

    if (rol !== 'funcionario' && Number(r.id_usuario) !== Number(usuarioId)) {
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

    if (!usuario) return res.status(403).json({ ok: false, error: 'Token requerido o inválido' });
    if (!Number.isInteger(idLicencia) || idLicencia <= 0)
      return res.status(400).json({ ok: false, error: 'ID de licencia inválido' });

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
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');

    const baseLocal = process.env.STORAGE_LOCAL_BASE || 'uploads';
    const ruta = String(archivo.ruta_url || '');

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
    if (req.user?.rol !== 'funcionario') {
      return res.status(403).json({ error: 'NO_AUTORIZADO' });
    }

    const lic = await LicenciaMedica.findByPk(id);
    if (!lic) return res.status(404).json({ error: 'LICENCIA_NO_ENCONTRADA' });

    lic.estado = nuevo_estado;
    if (nuevo_estado === 'rechazado') {
      lic.motivo_rechazo = motivo_rechazo ?? lic.motivo_rechazo;
    }

    await lic.save({ userId: req.user.id });
    return res.json({ ok: true, data: { id: lic.id_licencia, estado: lic.estado } });
  } catch (err) { next(err); }
}

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
