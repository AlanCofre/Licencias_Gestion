// backend/src/routes/licencias.routes.js
import { Router } from 'express';
import multer from 'multer';
import db from '../../db/db.js';

import {
  crearLicencia,
  listarLicencias,
  decidirLicencia,
  getLicenciasEnRevision,
  detalleLicencia,
  descargarArchivoLicencia,
  licenciasResueltas,
} from '../../controllers/licencias.controller.js';

import { validarJWT, esEstudiante, tieneRol } from '../../middlewares/auth.js';
import { cambiarEstado } from '../../controllers/licencias.controller.js';
import { authRequired } from '../../middlewares/requireAuth.js';
import { requireRole } from '../../middlewares/requireRole.js';
import { validateDecision } from '../../middlewares/validateDecision.js';
import {
  validateLicenciaBody,
  validarArchivoAdjunto,
  validarTransicionEstado,
  normalizaEstado,
} from '../../middlewares/validarLicenciaMedica.js';
import { decidirLicenciaSvc } from '../../services/servicio_Licencias.js';

import LicenciaMedica from '../models/modelo_LicenciaMedica.js';
import Usuario from '../models/modelo_Usuario.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

async function cargarLicencia(req, res, next) {
  try {
    const lic = await LicenciaMedica.findByPk(req.params.id);
    if (!lic) return res.status(404).json({ ok: false, error: 'Licencia no encontrada' });
    req.licencia = lic;
    next();
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: 'Error al obtener licencia' });
  }
}

/* ===== Listados / creación ===== */
router.get('/', validarJWT, listarLicencias);
router.get('/en-revision', validarJWT, getLicenciasEnRevision);

/* === Licencias del estudiante autenticado === */
router.get('/mis-licencias', validarJWT, esEstudiante, async (req, res) => {
  try {
    // Acepta todas las variantes posibles que puede dejar tu middleware:
    const idUsuario =
      req.user?.id_usuario ??
      req.user?.id ??
      req.id ??
      req.user?.sub ??
      null;

    // Si no viene, es problema de autenticación → 401
    if (!idUsuario) {
      return res.status(401).json({ ok: false, error: 'No autenticado' });
    }

    const [rows] = await db.execute(
      `
      SELECT
        id_licencia           AS id,
        folio,
        DATE_FORMAT(fecha_emision, '%Y-%m-%d') AS fecha_emision,
        DATE_FORMAT(fecha_inicio,  '%Y-%m-%d') AS fecha_inicio,
        DATE_FORMAT(fecha_fin,     '%Y-%m-%d') AS fecha_fin,
        estado,
        motivo_rechazo,
        DATE_FORMAT(fecha_creacion, '%Y-%m-%d %H:%i:%s') AS fecha_creacion
      FROM LicenciaMedica
      WHERE id_usuario = ?
      ORDER BY fecha_creacion DESC
      `,
      [idUsuario]
    );

    // Devuelve OK con arreglo (aunque esté vacío)
    return res.status(200).json({ ok: true, data: rows });
  } catch (error) {
    console.error('❌ Error en GET /mis-licencias:', error);
    return res.status(500).json({
      ok: false,
      error: 'Error interno al obtener licencias del estudiante',
    });
  }
});

/**
 * Detalle de licencia (shape compatible con el FE)
 */
router.get('/detalle/:id', validarJWT, async (req, res) => {
  try {
    const id = Number(req.params.id);
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

        u.id_usuario      AS usuario_id,
        u.nombre          AS usuario_nombre,
        u.correo_usuario  AS usuario_email,
        NULL              AS usuario_facultad
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
            facultad: r.usuario_facultad,
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
    } catch (errArchivo) {
      console.warn('Detalle: no se pudo obtener archivo (se omite):', errArchivo?.message);
    }

    return res.json({ ok: true, licencia });
  } catch (error) {
    console.error('❌ Error en GET /detalle/:id:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/licencias/:id/archivo', validarJWT, descargarArchivoLicencia);

// SOLO Estudiante (creación con validaciones de negocio)
router.post(
  '/crear',
  [validarJWT, esEstudiante],
  upload.single('archivo'),
  validarArchivoAdjunto,
  validateLicenciaBody,
  crearLicencia
);

// Profesor o Secretario (demo simple)
router.get('/revisar', [validarJWT, tieneRol('profesor', 'funcionario')], (req, res) => {
  res.json({ ok: true, msg: 'Revisando licencias...', rol: req.rol });
});

/**
 * Decidir licencia (SECRETARIO / FUNCIONARIO):
 * FIX: inyectamos id_usuario desde el token ANTES de validateDecision
 */
router.put(
  '/:id/estado',
  authRequired,
  requireRole(['funcionario']),
  cambiarEstado
);

router.post(
  '/:id/decidir',
  authRequired,
  requireRole(['funcionario']),
  // 🔧 inject id_usuario for validateDecision
  (req, _res, next) => {
    req.body ||= {};
    if (!req.body.id_usuario) req.body.id_usuario = req.user?.id_usuario ?? req.user?.id ?? null;
    // tolerancia a "estado" o "decision"
    if (req.body.estado && !req.body.decision) req.body.decision = req.body.estado;
    next();
  },
  validateDecision,
  cargarLicencia,
  (req, res, next) => validarTransicionEstado(req.licencia.estado)(req, res, next),
  (req, _res, next) => {
    if (req.body?.estado) req.body.estado = normalizaEstado(req.body.estado);
    if (req.body?.decision) req.body.decision = normalizaEstado(req.body.decision);
    next();
  },
  decidirLicencia
);

router.put(
  '/:id/notificar',
  authRequired,
  requireRole(['funcionario']),
  // 🔧 inject id_usuario también aquí por si el middleware lo necesita
  (req, _res, next) => {
    req.body ||= {};
    if (!req.body.id_usuario) req.body.id_usuario = req.user?.id_usuario ?? req.user?.id ?? null;
    next();
  },
  validateDecision,
  async (req, res) => {
    try {
      const idLicencia = Number(req.params.id);
      const { estado, motivo_rechazo, observacion, fecha_inicio, fecha_fin } = req.body;
      const actorId = req.user?.id_usuario ?? null;

      const resultado = await decidirLicenciaSvc({
        idLicencia,
        estado,
        motivo_rechazo,
        observacion,
        _fi: fecha_inicio,
        _ff: fecha_fin,
        idFuncionario: actorId,
        ip: req.ip 
      });

      return res.status(200).json({ ok: true, ...resultado });
    } catch (error) {
      console.error('❌ Error en /notificar:', error);
      return res.status(error.http ?? 500).json({ ok: false, error: error.message });
    }
  }
);

/**
 * Licencias resueltas (aceptadas/rechazadas) con datos del usuario (LEFT JOIN).
 */
router.get('/resueltas', validarJWT, async (req, res) => {
  const { estado, desde, hasta } = req.query;
  let condiciones = [`l.estado IN ('aceptado', 'rechazado')`];
  const valores = [];

  if (estado && ['aceptado', 'rechazado'].includes(estado)) {
    condiciones = [`l.estado = ?`];
    valores.push(estado);
  }
  if (desde) { condiciones.push(`l.fecha_emision >= ?`); valores.push(desde); }
  if (hasta) { condiciones.push(`l.fecha_emision <= ?`); valores.push(hasta); }

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

  try {
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
        u.correo_usuario  AS usuario_email,
        NULL              AS usuario_facultad
      FROM licenciamedica l
      LEFT JOIN usuario u ON u.id_usuario = l.id_usuario
      ${where}
      ORDER BY l.fecha_creacion DESC
      `,
      valores
    );

    const licencias = rows.map(r => ({
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
            facultad: r.usuario_facultad, // null
            email: r.usuario_email
          }
        : null
    }));

    return res.status(200).json({ licencias });
  } catch (error) {
    console.error('❌ Error al obtener licencias resueltas:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post(
  '/',
  validarJWT,
  esEstudiante,
  upload.single('archivo'),
  validarArchivoAdjunto,
  validateLicenciaBody,
  crearLicencia
);

/* ===== Rutas con :id ===== */
router.get('/:id', validarJWT, detalleLicencia);
router.get('/:id/archivo', validarJWT, descargarArchivoLicencia);

router.post(
  '/:id/rechazar',
  validarJWT,
  tieneRol('funcionario'),
  (req, _res, next) => { req.body = { ...(req.body || {}), decision: 'rechazado' }; next(); },
  validateDecision,
  cargarLicencia,
  (req, res, next) => validarTransicionEstado(req.licencia.estado)(req, res, next),
  decidirLicencia
);

export default router;
