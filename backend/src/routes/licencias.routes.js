// backend/src/routes/licencias.routes.js
import { Router } from 'express';
import multer from 'multer';
import db from '../../db/db.js';

import {
  crearLicencia,
  listarLicencias,
  notificarEstado,
  decidirLicencia,
  getLicenciasEnRevision,
  detalleLicencia,
  descargarArchivoLicencia
} from '../../controllers/licencias.controller.js';

import { validarJWT, esEstudiante, tieneRol } from '../../middlewares/auth.js';
import { validateDecision } from '../../middlewares/validateDecision.js';
import {
  validateLicenciaBody,
  validarArchivoAdjunto,
  validarTransicionEstado,
  normalizaEstado,
} from '../../middlewares/validarLicenciaMedica.js';

import LicenciaMedica from '../models/modelo_LicenciaMedica.js';

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

/* ⚠️ Ubica /resueltas ANTES de cualquier '/:id' */
router.get('/resueltas', validarJWT, async (req, res) => {
  const { estado, desde, hasta } = req.query;
  let condiciones = [`estado IN ('aceptado', 'rechazado')`];
  const valores = [];

  if (estado && ['aceptado', 'rechazado'].includes(estado)) {
    condiciones = [`estado = ?`];
    valores.push(estado);
  }
  if (desde) { condiciones.push(`fecha_emision >= ?`); valores.push(desde); }
  if (hasta) { condiciones.push(`fecha_emision <= ?`); valores.push(hasta); }

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

  try {
    const [licencias] = await db.execute(`
      SELECT id_licencia, folio, fecha_emision, fecha_inicio, fecha_fin,
             estado, motivo_rechazo, fecha_creacion, id_usuario
      FROM licenciamedica
      ${where}
      ORDER BY fecha_creacion DESC
    `, valores);
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

/* ===== Rutas con :id (restringidas a numérico) ===== */
router.get('/:id(\\d+)', validarJWT, detalleLicencia);
router.get('/:id(\\d+)/archivo', validarJWT, descargarArchivoLicencia);

router.post(
  '/:id(\\d+)/decidir',
  validarJWT,
  tieneRol('funcionario'),
  validateDecision,
  cargarLicencia,
  (req, res, next) => validarTransicionEstado(req.licencia.estado)(req, res, next),
  (req, _res, next) => { if (req.body?.estado) req.body.estado = normalizaEstado(req.body.estado); next(); },
  decidirLicencia
);

router.post(
  '/:id(\\d+)/rechazar',
  validarJWT,
  tieneRol('funcionario'),
  (req, _res, next) => { req.body = { ...(req.body || {}), decision: 'rechazado' }; next(); },
  validateDecision,
  cargarLicencia,
  (req, res, next) => validarTransicionEstado(req.licencia.estado)(req, res, next),
  decidirLicencia
);

router.put(
  '/:id(\\d+)/notificar',
  validarJWT,
  tieneRol('funcionario'),
  validateDecision,
  cargarLicencia,
  (req, res, next) => validarTransicionEstado(req.licencia.estado)(req, res, next),
  (req, _res, next) => { if (req.body?.estado) req.body.estado = normalizaEstado(req.body.estado); next(); },
  notificarEstado
);

export default router;
