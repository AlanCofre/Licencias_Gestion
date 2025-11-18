// backend/src/routes/profesor.routes.js
import { Router } from 'express';
import { 
  obtenerLicenciasProfesor, 
  obtenerEntregaProfesorPorId 
} from '../../controllers/profesorController.js';
import requireAuth from '../../middlewares/requireAuth.js';
import { esProfesor } from '../../middlewares/roles.middleware.js';

const router = Router();

/**
 * GET /profesor/licencias
 * Lista licencias visibles para el profesor autenticado
 */
router.get('/licencias', requireAuth, esProfesor, obtenerLicenciasProfesor);

/**
 * GET /profesor/licencias/:idEntrega
 * Detalle de una entrega específica
 */
router.get('/licencias/:idEntrega', requireAuth, esProfesor, obtenerEntregaProfesorPorId);

export default router;