// backend/controllers/licencias.controller.js  (ESM unificado)
import crypto from 'crypto';
import db from '../config/db.js'; // ← ajusta la ruta si corresponde
import { decidirLicenciaSvc } from '../services/servicio_Licencias.js';

// === Utilidad: hash SHA-256 de un Buffer/String → hex 64
function sha256FromBuffer(bufOrStr) {
  const h = crypto.createHash('sha256');
  h.update(bufOrStr);
  return h.digest('hex');
}


// ===============================================
// GET: listar licencias del usuario autenticado
// ===============================================
export const listarLicencias = async (req, res) => {
  try {
    const usuarioId = req.user?.id_usuario ?? req.id ?? null;
    const rol = req.user?.rol ?? req.rol ?? null;

    if (!usuarioId) {
      return res.status(401).json({ msg: 'No autenticado' });
    }

    const [rows] = await db.execute(
      `SELECT id_licencia, folio, fecha_emision, fecha_inicio, fecha_fin, estado, motivo_rechazo, fecha_creacion
         FROM LicenciaMedica
        WHERE id_usuario = ?
        ORDER BY fecha_emision DESC, id_licencia DESC`,
      [usuarioId]
    );

    return res.json({
      msg: 'Listado de licencias del usuario',
      usuarioId,
      rol,
      data: rows,
    });
  } catch (error) {
    console.error('[licencias:listarLicencias] error:', error);
    return res.status(500).json({ msg: 'Error al listar licencias' });
  }
};

// =====================================================
// POST: crear licencia (con validaciones reales)
// =====================================================
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

    const { fecha_inicio, fecha_fin, motivo } = req.body || {};
    const isISO = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d);

    if (!isISO(fecha_inicio) || !isISO(fecha_fin)) {
      return res.status(400).json({ msg: 'fecha_inicio/fecha_fin deben ser YYYY-MM-DD' });
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

      // En tu tabla archivo_licencia: ruta_url NOT NULL
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

    let sql, params;
    if (rol === 'secretario') {
      sql = `
        SELECT id_licencia, folio, fecha_emision, fecha_inicio, fecha_fin, estado, motivo_rechazo, fecha_creacion, id_usuario
        FROM LicenciaMedica
        WHERE estado = 'pendiente'
        ORDER BY fecha_emision DESC, id_licencia DESC
        LIMIT ? OFFSET ?
      `;
      params = [parseInt(req.query.limit) || 10, ((parseInt(req.query.page) || 1) - 1) * (parseInt(req.query.limit) || 10)];
    } else {
      sql = `
        SELECT id_licencia, folio, fecha_emision, fecha_inicio, fecha_fin, estado, motivo_rechazo, fecha_creacion, id_usuario
        FROM LicenciaMedica
        WHERE estado = 'pendiente' AND id_usuario = ?
        ORDER BY fecha_emision DESC, id_licencia DESC
        LIMIT ? OFFSET ?
      `;
      params = [usuarioId, parseInt(req.query.limit) || 10, ((parseInt(req.query.page) || 1) - 1) * (parseInt(req.query.limit) || 10)];
    }

    const [rows] = await db.execute(sql, params);

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
    if (rol === 'secretario') {
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

export async function decidirLicencia(req, res) {
  try {
    const idLicencia = Number(req.params.id);
    const motivo_rechazo = req.body.motivo_rechazo ?? null;
    const { estado, force } = req.body || {};

    const idSecretario =
      req.user?.id_usuario ??
      req.user?.id ??
      null;

    if (!idSecretario) {
      return res.status(401).json({
        ok: false,
        error: 'Token sin id_usuario (no se puede registrar historial)'
      });
    }

    const nuevoEstado = (estado || '').toString().trim();
    if (!['pendiente', 'aceptado', 'rechazado'].includes(nuevoEstado)) {
      return res.status(400).json({ ok: false, error: 'estado no válido' });
    }

    if (nuevoEstado === 'rechazado') {
      if (!motivo_rechazo || String(motivo_rechazo).trim() === '') {
        return res.status(400).json({ ok: false, error: 'Debe incluir motivo_rechazo al rechazar' });
      }
    }

    const licencia = await decidirLicenciaSvc({
      idLicencia,
      estado: nuevoEstado,
      motivo_rechazo: nuevoEstado === 'rechazado' ? String(motivo_rechazo).trim() : null,
      idSecretario,
      force: !!force,
    });

    return res.json({
      ok: true,
      data: {
        id_licencia: licencia.id_licencia,
        estado: licencia.estado,
        motivo_rechazo: licencia.motivo_rechazo ?? null,
      },
    });
  } catch (err) {
    const msg = err?.message || 'Error al decidir licencia';
    const code = /no encontrada/i.test(msg) ? 404
               : /ya fue/i.test(msg)       ? 409
               : /motivo_rechazo/i.test(msg) ? 400
               : /no permitida|transición/i.test(msg) ? 400
               : 500;
    return res.status(code).json({ ok: false, error: msg });
  }
}
// =====================================================
// POST: crear licencia (solo formulario, sin archivo ni validaciones)
// =====================================================
export async function crearLicenciaSoloFormulario(req, res) {
  try {
    const id_usuario = req.user?.id_usuario;
    if (!id_usuario) return res.status(401).json({ ok:false, error:"No autenticado" });

    const { folio, fecha_emision, fecha_inicio, fecha_fin } = req.body || {};

    // Validaciones mínimas acordadas (los 4 campos son obligatorios)
    const isISO = (d) => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d);
    if (!folio || !isISO(fecha_emision) || !isISO(fecha_inicio) || !isISO(fecha_fin)) {
      return res.status(400).json({ ok:false, error:"Campos inválidos: folio, fecha_emision, fecha_inicio, fecha_fin (YYYY-MM-DD)" });
    }
    if (fecha_inicio > fecha_fin) {
      return res.status(400).json({ ok:false, error:"fecha_inicio no puede ser mayor que fecha_fin" });
    }
    if (fecha_emision > fecha_inicio) {
      return res.status(400).json({ ok:false, error:"fecha_emision no puede ser posterior al inicio de reposo" });
    }

    // Inserción directa SIN archivo, forzando estado 'pendiente' y motivo_rechazo NULL
    const [result] = await db.execute(`
      INSERT INTO LicenciaMedica
        (folio, fecha_emision, fecha_inicio, fecha_fin, estado, motivo_rechazo, fecha_creacion, id_usuario)
      VALUES (?, ?, ?, ?, 'pendiente', NULL, CURDATE(), ?)
    `, [String(folio).trim(), fecha_emision, fecha_inicio, fecha_fin, id_usuario]);

    const [rows] = await db.execute(
      `SELECT id_licencia, folio, fecha_emision, fecha_inicio, fecha_fin, estado, motivo_rechazo, fecha_creacion, id_usuario
         FROM LicenciaMedica WHERE id_licencia = ?`,
      [result.insertId]
    );

    return res.status(201).json({ ok:true, data: rows[0] });
  } catch (e) {
    console.error("[crearLicenciaSoloFormulario]", e);
    return res.status(500).json({ ok:false, error:"Error del servidor" });
  }
}


export default { listarLicencias, crearLicencia, crearLicenciaLegacy, getLicenciasEnRevision, decidirLicencia, detalleLicencia, crearLicenciaSoloFormulario};
