import { Router } from 'express';
import { validarJWT, esEstudiante, tieneRol } from '../../middlewares/auth.js';
import { crearLicencia, listarLicencias } from '../../controllers/licencias.controller.js';
import { decidirLicencia } from '../../controllers/licencias.controller.js';
import { authRequired } from '../../middlewares/requireAuth.js';
import { requireRole } from '../../middlewares/requireRole.js';
import { validateDecision } from '../../middlewares/validateDecision.js';

const router = Router();

/**
 * Rutas protegidas con JWT y control por rol
 * - /mis-licencias  → cualquier usuario autenticado
 * - /crear          → SOLO ESTUDIANTE
 * - /revisar        → PROFESOR o SECRETARIO
 */

// Autenticado (cualquier rol)
router.get('/mis-licencias', validarJWT, listarLicencias);

// SOLO Estudiante
router.post('/crear', [validarJWT, esEstudiante], crearLicencia);

// Profesor o Secretario
router.get('/revisar', [validarJWT, tieneRol('profesor', 'secretario')], (req, res) => {
  res.json({ ok: true, msg: 'Revisando licencias...', rol: req.rol });
});

router.put(
  '/licencias/:id/decidir',
  authRequired,                       // verifica JWT -> req.user
  requireRole(['Secretario']),        // solo secretaria/secretario
  validateDecision,                   // valida body
  decidirLicencia                     // controller
);

export default router;
