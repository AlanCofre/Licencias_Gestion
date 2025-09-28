// backend/src/routes/licencias.routes.js
import { Router } from 'express';
import multer from 'multer';

import { validarJWT, esEstudiante, tieneRol } from '../../middlewares/auth.js';
import { crearLicencia, listarLicencias } from '../../controllers/licencias.controller.js';
import { decidirLicencia } from '../../controllers/licencias.controller.js';

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
  requireRole(['Secretario']),     // solo secretario/a
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

export default router;
