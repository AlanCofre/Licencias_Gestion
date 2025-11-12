// src/routes/reportes.route.js
import { Router } from 'express';
import { validarJWT, tieneRol, ROLES } from '../../middlewares/auth.js';
import { reporteExcesoLicenciasCtrl, repeticionPatologiasCtrl } from '../../controllers/reportes.controller.js';

const router = Router();

/**
 * Acceso permitido:
 * - ADMIN (total)
 * - PROFESOR (limitado a sus cursos; lo resuelve el service)
 * Si más adelante agregas "secretaria", agrégalo aquí: ROLES.SEC
 */
router.get(
  '/reportes/licencias/exceso',
  validarJWT,
  tieneRol(ROLES.ADMIN, ROLES.PROF),
  reporteExcesoLicenciasCtrl
);

router.get(
  '/reportes/licencias/repetidas',
  validarJWT,
  tieneRol(ROLES.ADMIN, ROLES.PROF, ROLES.FUNC), // acceso para funcionario, profesor y admin
  repeticionPatologiasCtrl
);

export default router;
