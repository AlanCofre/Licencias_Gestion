// backend/src/routes/profesor.routes.js
import { Router } from 'express';
import { validarJWT, esProfesor } from '../../middlewares/auth.js';
import {
  listarLicenciasProfesor,
  obtenerEntregaProfesorPorId,
} from '../../controllers/profesorController.js';

const router = Router();

/**
 * GET /profesor/licencias
 * Lista licencias visibles para el profesor autenticado
 */
router.get('/licencias', validarJWT, esProfesor, listarLicenciasProfesor);

/**
 * GET /profesor/licencias/:idEntrega
 * Detalle de una entrega específica
 */
router.get(
  '/licencias/:idEntrega',
  validarJWT,
  esProfesor,
  obtenerEntregaProfesorPorId
);

export default router;
