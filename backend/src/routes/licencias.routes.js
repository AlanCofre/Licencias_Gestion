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

import { authRequired } from '../../middlewares/requireAuth.js';
import { requireRole } from '../../middlewares/requireRole.js';
import { validateDecision } from '../../middlewares/validateDecision.js';
// 🔗 Middlewares de validación de negocio (mismo archivo unificado)
import {
  validateLicenciaBody,        // Zod: fechas, id_usuario, estado normalizado, etc.
  validarArchivoAdjunto,       // archivo obligatorio + tipo/tamaño (multer)
  validarTransicionEstado,     // regla de transición (pendiente→aceptado|rechazado)
  normalizaEstado,
} from '../../middlewares/validarLicenciaMedica.js';

import LicenciaMedica from '../models/modelo_LicenciaMedica.js';

const router = Router();

router.patch(
  '/:id/decision',           // ← relativo (no poner /api ni /licencias aquí)
  validarJWT,
  tieneRol('funcionario'),
  validateDecision,
  decidirLicencia
);



// Multer: archivo en memoria (luego tu controller lo sube a Firebase/S3 si aplica)
const upload = multer({ storage: multer.memoryStorage() });

/**
 * Helper: carga la licencia por :id y la inyecta en req.licencia
 */
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

/**
 * Rutas protegidas con JWT y control por rol
 * - /mis-licencias  → cualquier usuario autenticado
 * - /crear          → SOLO ESTUDIANTE
 * - /revisar        → PROFESOR o SECRETARIO
 */

// Autenticado (cualquier rol)
router.get('/mis-licencias', validarJWT, listarLicencias);
router.get('/en-revision', validarJWT, getLicenciasEnRevision);
router.get('/detalle/:id', validarJWT, detalleLicencia);
router.get('/licencias/:id/archivo', validarJWT, descargarArchivoLicencia);
// SOLO Estudiante (creación con validaciones de negocio)
router.post(
  '/crear',
  [validarJWT, esEstudiante],
  upload.single('archivo'),   // req.file
  validarArchivoAdjunto,      // archivo obligatorio/tipo/tamaño (o archivo_url)
  validateLicenciaBody,       // Zod: fechas (YYYY-MM-DD, <=90 días), estado, etc.
  crearLicencia               // tu controller (forzarás estado 'pendiente' al guardar)
);

// Profesor o Secretario (demo simple)
router.get('/revisar', [validarJWT, tieneRol('profesor', 'secretario')], (req, res) => {
  res.json({ ok: true, msg: 'Revisando licencias...', rol: req.rol });
});

/**
 * Decidir licencia (SECRETARIO):
 * - validateDecision: valida body (ej. { estado, motivo_rechazo })
 * - cargarLicencia: trae la licencia y la deja en req.licencia
 * - validarTransicionEstado: aplica la regla de transición usando el estado actual
 *   pendiente → (aceptado|rechazado) ✅; otras ❌
 */
router.put(
  '/licencias/:id/decidir',
  authRequired,                    // verifica JWT -> req.user
  requireRole(['secretario']),     // solo secretario/a
  validateDecision,                // valida body de la decisión
  cargarLicencia,                  // req.licencia disponible
  (req, res, next) =>              // valida transición según estado actual
    validarTransicionEstado(req.licencia.estado)(req, res, next),
  // Ajuste pequeño: normaliza estado por consistencia antes del controller
  (req, _res, next) => {
    if (req.body?.estado) req.body.estado = normalizaEstado(req.body.estado);
    next();
  },
  decidirLicencia                  // controller que persiste cambios
);

router.put(
  '/:id/notificar',
  authRequired,
  requireRole(['secretario']),
  validateDecision,
  cargarLicencia,
  (req, res, next) =>
    validarTransicionEstado(req.licencia.estado)(req, res, next),
  (req, _res, next) => {
    if (req.body?.estado) req.body.estado = normalizaEstado(req.body.estado);
    next();
  },
  notificarEstado
);


router.get('/resueltas', validarJWT, async (req, res) => {
  const { estado, desde, hasta } = req.query;

  let condiciones = [`estado IN ('aceptado', 'rechazado')`];
  let valores = [];

  if (estado && ['aceptado', 'rechazado'].includes(estado)) {
    condiciones = [`estado = ?`];
    valores.push(estado);
  }

  if (desde) {
    condiciones.push(`fecha_emision >= ?`);
    valores.push(desde);
  }

  if (hasta) {
    condiciones.push(`fecha_emision <= ?`);
    valores.push(hasta);
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

  try {
    const [licencias] = await db.execute(`
      SELECT 
        id_licencia,
        folio,
        fecha_emision,
        fecha_inicio,
        fecha_fin,
        estado,
        motivo_rechazo,
        fecha_creacion,
        id_usuario
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




export default router;


