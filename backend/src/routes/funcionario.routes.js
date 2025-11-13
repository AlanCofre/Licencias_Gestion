import { Router } from 'express';
import { validarJWT, esFuncionario } from '../../middlewares/auth.js';
import {
  getAlertaLicenciasAnuales,
  listarAlertasExcesoLicencias,
} from '../../controllers/alertas.controller.js';

const router = Router();

// Detalle por estudiante
router.get(
  '/estudiantes/:id/alerta-licencias',
  validarJWT,
  esFuncionario,
  getAlertaLicenciasAnuales
);

// Lista global (overlay)
router.get(
  '/alertas/exceso-licencias',
  validarJWT,
  esFuncionario,
  listarAlertasExcesoLicencias
);

export default router;
