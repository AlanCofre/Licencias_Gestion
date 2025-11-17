import crypto from 'crypto';
import LicenciaMedica from '../src/models/modelo_LicenciaMedica.js';
import db from '../config/db.js';
import fs from 'fs';
import path from 'path';
import { subirPDFLicencia } from '../services/supabase/storage.service.js';

import {
  notificarNuevaLicencia,
  notificarLicenciaCreadaEstudiante,
  notificarEstadoLicenciaEstudiante
} from '../services/servicio_Correo.js';

import { calcularRegularidadEstudiante } from '../services/regularidad.service.js';

function sha256FromBuffer(bufOrStr) {
  const h = crypto.createHash('sha256');
  h.update(bufOrStr);
  return h.digest('hex');
}

// ───────────────────────────────────────────────
// GET /api/licencias/mis-licencias
// ───────────────────────────────────────────────
export async function listarMisLicencias(req, res) {
  try {
    const idUsuario =
      req.user?.id_usuario ?? req.user?.id ?? null;

    if (!idUsuario) {
      return res.status(401).json({ ok: false, error: 'No autenticado' });
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const [rows] = await db.execute(
      `
      SELECT
        id_licencia,
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
        total: Number(total),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: 'Error al obtener licencias'
    });
  }
}

// ───────────────────────────────────────────────
// GET /api/licencias (listado simple)
// ───────────────────────────────────────────────
export async function listarLicencias(req, res) {
  try {
    const idUsuario =
      req.user?.id_usuario ??
      req.user?.id ??
      req.user?.sub ??
      null;

    if (!idUsuario) {
      return res.status(401).json({ ok: false, mensaje: 'No autenticado' });
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
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
    return res.status(500).json({ ok: false, mensaje: 'Error al listar licencias' });
  }
}

// ───────────────────────────────────────────────
// Helpers internos
// ───────────────────────────────────────────────
function _str(v) {
  return v === undefined || v === null ? null : String(v).trim();
}

async function _getEstudianteNombre(idUsuario) {
  const [rows] = await db.execute(
    'SELECT nombre FROM usuario WHERE id_usuario = ? LIMIT 1',
    [idUsuario]
  );
  return rows[0]?.nombre || 'Estudiante';
}

async function _notificarFuncionariosNuevaLicencia(idLicencia, usuarioId, folio, fecha_inicio, fecha_fin) {
  try {
    await notificarNuevaLicencia({
      folio,
      estudiante: { nombre: await _getEstudianteNombre(usuarioId) },
      fechaCreacionISO: new Date().toISOString(),
      enlaceDetalle: `${process.env.APP_URL || 'http://localhost:3000'}/licencias/${idLicencia}`
    });

    console.log(`[Licencias] Notificación enviada a funcionarios (licencia ${idLicencia})`);
  } catch (_) {
    // no se interrumpe flujo
  }
}

async function _notificarEstudianteLicenciaCreada(usuarioId, folio, fecha_inicio, fecha_fin) {
  try {
    const [rows] = await db.execute(
      'SELECT correo_usuario, nombre FROM usuario WHERE id_usuario = ? LIMIT 1',
      [usuarioId]
    );

    if (rows.length > 0) {
      await notificarLicenciaCreadaEstudiante({
        to: rows[0].correo_usuario,
        folio,
        estudianteNombre: rows[0].nombre,
        fechaInicio: fecha_inicio,
        fechaFin: fecha_fin
      });
    }

    console.log(`[Licencias] Correo enviado al estudiante al crear licencia`);
  } catch (_) {
    // no se interrumpe
  }
}

export const crearLicencia = async (req, res) => {
  try {
    const usuarioId = req.user?.id_usuario ?? null;
    const rol = (req.user?.rol ?? '').toString().toLowerCase();

    if (!usuarioId) {
      return res.status(401).json({ msg: 'No autenticado' });
    }

    if (rol !== 'estudiante') {
      return res.status(403).json({ msg: 'Solo estudiantes pueden crear licencias' });
    }

    // Normalización del body
    const folio = _str(req.body?.folio);
    const fecha_inicio = _str(req.body?.fecha_inicio);
    const fecha_fin = _str(req.body?.fecha_fin);
    const motivo_medico = _str(req.body?.motivo_medico);
    const motivo = _str(req.body?.motivo);

    if (!motivo_medico) {
      return res.status(400).json({ ok: false, error: 'El motivo médico es obligatorio' });
    }

    // Cursos
    let cursos = [];
    const cursosRaw = req.body?.cursos ?? null;
    if (cursosRaw) {
      try {
        cursos = typeof cursosRaw === 'string' ? JSON.parse(cursosRaw) : cursosRaw;
      } catch {
        cursos = [];
      }
    }
    if (!Array.isArray(cursos) || cursos.length === 0) {
      return res.status(400).json({
        ok: false,
        error: 'Debe seleccionar al menos un curso afectado.'
      });
    }

    // Validaciones de fechas
    const isISO = (d) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d);
    if (!folio) return res.status(400).json({ msg: 'El folio es obligatorio' });
    if (!isISO(fecha_inicio) || !isISO(fecha_fin)) {
      return res.status(400).json({ msg: 'fecha_inicio/fecha_fin deben ser YYYY-MM-DD' });
    }
    if (new Date(fecha_inicio) > new Date(fecha_fin)) {
      return res.status(400).json({ msg: 'La fecha de inicio no puede ser posterior a la fecha fin' });
    }

    // Validación de superposición
    const [solape] = await db.execute(
      `SELECT id_licencia
         FROM licenciamedica
        WHERE id_usuario = ?
          AND estado IN ('pendiente','aceptado')
          AND (? <= fecha_fin AND ? >= fecha_inicio)
        LIMIT 1`,
      [usuarioId, fecha_inicio, fecha_fin]
    );

    if (solape.length) {
      return res.status(409).json({
        ok: false,
        code: 'LICENCIA_FECHAS_SUPERPUESTAS',
        error: 'Fechas superpuestas con otra licencia.'
      });
    }

    // Archivo PDF
    let archivo = req.file ?? (req.files?.archivo || req.files?.file) ?? null;

    // Cargar buffer si Multer usa disco
    if (archivo && !archivo.buffer && archivo.path) {
      archivo.buffer = fs.readFileSync(archivo.path);
      archivo.size = archivo.buffer.length;
    }

    if (!archivo) return res.status(400).json({ ok: false, error: 'Falta archivo PDF' });
    if (archivo.mimetype !== 'application/pdf') {
      return res.status(415).json({ ok: false, error: 'Solo se acepta PDF' });
    }

    // Hash del archivo
    const sha = crypto.createHash('sha256').update(archivo.buffer).digest('hex');

    // Validación hash duplicado
    const [dup] = await db.execute(
      `SELECT al.id_archivo, lm.id_licencia
         FROM ArchivoLicencia al
         JOIN licenciamedica lm ON lm.id_licencia = al.id_licencia
        WHERE lm.id_usuario = ? AND al.hash = ?
        LIMIT 1`,
      [usuarioId, sha]
    );
    if (dup.length) {
      return res.status(409).json({
        ok: false,
        code: 'ARCHIVO_HASH_DUPLICADO',
        error: `Este archivo ya fue usado en la licencia #${dup[0].id_licencia}.`
      });
    }

    // Inserción de licencia
    const [result] = await db.execute(
      `INSERT INTO licenciamedica
        (folio, fecha_emision, fecha_inicio, fecha_fin, estado,
         motivo_rechazo, motivo_medico, fecha_creacion, id_usuario)
       VALUES
        (?, CURDATE(), ?, ?, 'pendiente', NULL, ?, NOW(), ?)`,
      [
        folio,
        fecha_inicio,
        fecha_fin,
        motivo_medico,
        usuarioId
      ]
    );

    const idLicencia = result.insertId;

    // Notificación a funcionarios (no bloqueante)
    _notificarFuncionariosNuevaLicencia(idLicencia, usuarioId, folio, fecha_inicio, fecha_fin);

    // Notificación al estudiante (no bloqueante)
    _notificarEstudianteLicenciaCreada(usuarioId, folio, fecha_inicio, fecha_fin);

    // Subir PDF a Supabase
    const meta = await subirPDFLicencia(archivo, usuarioId);
    if (!meta?.ruta_url) {
      return res.status(502).json({ ok: false, error: 'No se pudo subir el archivo a Storage' });
    }

    // Guardar metadatos del archivo
    await db.execute(
      `INSERT INTO ArchivoLicencia
         (ruta_url, tipo_mime, hash, tamano, fecha_subida, id_licencia)
       VALUES (?, ?, ?, ?, NOW(), ?)`,
      [
        meta.ruta_url,
        meta.tipo_mime ?? 'application/pdf',
        meta.hash ?? sha,
        Number(meta.tamano ?? archivo.size ?? 0),
        idLicencia
      ]
    );

    console.log(`[Licencias] Licencia creada (#${idLicencia})`);

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
        motivo_medico,
        fecha_creacion: new Date().toISOString(),
        id_usuario: usuarioId,
        motivo: motivo ?? null,
        archivo: { ruta_url: meta.ruta_url }
      }
    });
  } catch (error) {
    return res.status(500).json({ msg: 'Error al crear la licencia' });
  }
};

export const getLicenciasEnRevision = async (req, res) => {
  try {
    const usuarioId = req.user?.id_usuario ?? null;
    const rol = (req.user?.rol ?? '').toLowerCase();

    if (!usuarioId) return res.status(401).json({ error: 'No autenticado' });

    const { nombre, folio, desde, hasta, page = 1, limit = 10 } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    let condiciones = [`lm.estado = 'pendiente'`];
    let params = [];

    // Filtros solo para funcionario / secretario
    if (['funcionario', 'secretario'].includes(rol)) {
      if (nombre) { condiciones.push(`u.nombre LIKE ?`); params.push(`%${nombre}%`); }
      if (folio) { condiciones.push(`lm.folio LIKE ?`); params.push(`%${folio}%`); }
      if (desde) { condiciones.push(`lm.fecha_emision >= ?`); params.push(desde); }
      if (hasta) { condiciones.push(`lm.fecha_emision <= ?`); params.push(hasta); }
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
      JOIN usuario u ON lm.id_usuario = u.id_usuario
      ${where}
      ORDER BY lm.fecha_creacion DESC, lm.id_licencia DESC
      LIMIT ? OFFSET ?
    `, [...params, limitNum, offset]);

    const [countRows] = await db.execute(`
      SELECT COUNT(*) AS total
      FROM licenciamedica lm
      JOIN usuario u ON lm.id_usuario = u.id_usuario
      ${where}
    `, params);

    return res.status(200).json({
      ok: true,
      data: rows,
      meta: {
        page: pageNum,
        limit: limitNum,
        total: Number(countRows[0]?.total || 0),
        totalPages: Math.ceil(Number(countRows[0]?.total || 0) / limitNum)
      }
    });

  } catch (error) {
    return res.status(500).json({ ok: false, error: 'Error al obtener licencias en revisión' });
  }
};

// ───────────────────────────────────────────────
// GET /api/licencias/resueltas (funcionario)
// ───────────────────────────────────────────────
export const licenciasResueltas = async (req, res) => {
  try {
    const rol = (req.user?.rol ?? '').toLowerCase();
    if (rol !== 'funcionario')
      return res.status(403).json({ ok: false, error: 'Solo funcionarios pueden ver esta lista' });

    const { estado, nombre, folio, desde, hasta, page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    let condiciones = [`lm.estado IN ('aceptado','rechazado')`];
    let valores = [];

    if (estado && ['aceptado', 'rechazado'].includes(estado)) {
      condiciones.push(`lm.estado = ?`);
      valores.push(estado);
    }
    if (nombre) { condiciones.push(`u.nombre LIKE ?`); valores.push(`%${nombre}%`); }
    if (folio) { condiciones.push(`lm.folio LIKE ?`); valores.push(`%${folio}%`); }
    if (desde) { condiciones.push(`lm.fecha_emision >= ?`); valores.push(desde); }
    if (hasta) { condiciones.push(`lm.fecha_emision <= ?`); valores.push(hasta); }

    const where = `WHERE ${condiciones.join(' AND ')}`;

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
      JOIN usuario u ON lm.id_usuario = u.id_usuario
      ${where}
      ORDER BY lm.fecha_creacion DESC
      LIMIT ? OFFSET ?
    `, [...valores, limitNum, offset]);

    const [countRows] = await db.execute(`
      SELECT COUNT(*) AS total
      FROM licenciamedica lm
      JOIN usuario u ON lm.id_usuario = u.id_usuario
      ${where}
    `, valores);

    return res.status(200).json({
      ok: true,
      data: rows,
      meta: {
        page: pageNum,
        limit: limitNum,
        total: Number(countRows[0]?.total || 0),
        totalPages: Math.ceil(Number(countRows[0]?.total || 0) / limitNum)
      }
    });

  } catch (error) {
    return res.status(500).json({ ok: false, error: 'Error interno del servidor' });
  }
};

// ───────────────────────────────────────────────
// GET /api/licencias/:id — Detalle
// ───────────────────────────────────────────────
export const detalleLicencia = async (req, res) => {
  try {
    const usuarioId = req.user?.id_usuario ?? null;
    const rol = (req.user?.rol ?? '').toLowerCase();
    const id = Number(req.params.id);

    if (!usuarioId) return res.status(401).json({ error: 'No autenticado' });
    if (!id) return res.status(400).json({ error: 'ID inválido' });

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

        u.id_usuario AS usuario_id,
        u.nombre AS usuario_nombre,
        u.correo_usuario AS usuario_email
      FROM licenciamedica l
      LEFT JOIN usuario u ON u.id_usuario = l.id_usuario
      WHERE l.id_licencia = ?
      LIMIT 1
      `,
      [id]
    );

    if (rows.length === 0)
      return res.status(404).json({ error: 'Licencia no encontrada' });

    const r = rows[0];

    if (!['funcionario','secretario'].includes(rol) &&
        Number(r.id_usuario) !== Number(usuarioId)) {
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

    // Archivo
    try {
      const [archs] = await db.execute(
        `
        SELECT id_archivo, ruta_url, tipo_mime, hash, tamano, fecha_subida
        FROM archivolicencia
        WHERE id_licencia = ?
        ORDER BY id_archivo DESC
        LIMIT 1
        `,
        [id]
      );

      if (archs.length > 0) {
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
    } catch (_) {}

    console.log(`[Licencias] Detalle obtenido (#${id})`);

    return res.json({ ok: true, licencia });

  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener detalle' });
  }
};

import {
  crearLicenciaConArchivo,
  decidirLicenciaSvc
} from '../services/servicio_Licencias.js';

// ───────────────────────────────────────────────
// PUT /api/licencias/:id/decidir
// ───────────────────────────────────────────────
export const decidirLicencia = async (req, res) => {
  try {
    const idLicencia = Number(req.params.id);
    if (!idLicencia) return res.status(400).json({ error: 'ID inválido' });

    const rol = (req.user?.rol ?? '').toLowerCase();
    const actorId = req.user?.id_usuario ?? null;

    if (!actorId) return res.status(401).json({ error: 'No autenticado' });
    if (!['funcionario', 'secretario'].includes(rol))
      return res.status(403).json({ error: 'Rol no autorizado' });

    const {
      decision,
      estado,
      motivo_rechazo,
      observacion,
      fecha_inicio,
      fecha_fin
    } = req.body;

    const resultado = await decidirLicenciaSvc({
      idLicencia,
      decision,
      estado,
      motivo_rechazo,
      observacion,
      _fi: fecha_inicio,
      _ff: fecha_fin,
      idFuncionario: actorId,
      ip: req.ip
    });

    console.log(`[Licencias] Estado actualizado (#${idLicencia}) → ${resultado.estado}`);

    return res.json({ ok: true, ...resultado });

  } catch (err) {
    return res.status(err.http || 500).json({
      ok: false,
      error: err.message || 'Error actualizando estado'
    });
  }
};

// ───────────────────────────────────────────────
// GET /api/licencias/:id/entregas — cursos asociados
// ───────────────────────────────────────────────
export const obtenerEntregasDeLicencia = async (req, res) => {
  try {
    const idLicencia = Number(req.params.id);
    if (!idLicencia) return res.status(400).json({ error: 'ID inválido' });

    const [rows] = await db.execute(
      `
      SELECT 
        le.id_curso,
        c.nombre_curso,
        c.seccion,
        u.nombre AS profesor
      FROM licencias_entregas le
      JOIN curso c ON le.id_curso = c.id_curso
      LEFT JOIN usuario u ON c.id_usuario = u.id_usuario
      WHERE le.id_licencia = ?
      ORDER BY le.id_curso ASC
      `,
      [idLicencia]
    );

    return res.json({ ok: true, entregas: rows });

  } catch (err) {
    return res.status(500).json({ ok: false, error: 'Error al obtener entregas' });
  }
};

// ───────────────────────────────────────────────
// GET /api/licencias/archivo/:id_archivo — descargar
// ───────────────────────────────────────────────
export const descargarArchivoLicencia = async (req, res) => {
  try {
    const idArchivo = Number(req.params.id_archivo);
    if (!idArchivo) return res.status(400).json({ error: 'ID inválido' });

    const [rows] = await db.execute(
      `SELECT ruta_url, tipo_mime FROM archivolicencia WHERE id_archivo = ? LIMIT 1`,
      [idArchivo]
    );

    if (!rows.length)
      return res.status(404).json({ error: 'Archivo no encontrado' });

    const archivo = rows[0];

    return res.json({
      ok: true,
      archivo: {
        url: archivo.ruta_url,
        mimetype: archivo.tipo_mime
      }
    });

  } catch (err) {
    return res.status(500).json({ error: 'Error al obtener archivo' });
  }
};

// ───────────────────────────────────────────────
// GET /api/licencias/regularidad/:id_usuario
// ───────────────────────────────────────────────
export const verificarRegularidadEstudiante = async (req, res) => {
  try {
    const idUsuario = Number(req.params.id_usuario);
    if (!idUsuario) return res.status(400).json({ error: 'ID inválido' });

    const [rows] = await db.execute(
      `
      SELECT COUNT(*) AS total
      FROM licenciamedica
      WHERE id_usuario = ? AND estado = 'aceptado'
      `,
      [idUsuario]
    );

    const total = Number(rows[0]?.total || 0);

    return res.json({
      ok: true,
      id_usuario: idUsuario,
      total_licencias_aceptadas: total,
      exceso: total > 5
    });

  } catch (err) {
    return res.status(500).json({ error: 'Error al verificar regularidad' });
  }
};

// ───────────────────────────────────────────────
// EXPORT FINAL
// ───────────────────────────────────────────────
export default {
  crearLicencia,
  getLicenciasEnRevision,
  licenciasResueltas,
  detalleLicencia,
  decidirLicencia,
  obtenerEntregasDeLicencia,
  descargarArchivoLicencia,
  verificarRegularidadEstudiante
};
