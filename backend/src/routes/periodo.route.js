// backend/routes/periodo.route.js
import { Router } from 'express';
import { 
  listarPeriodos, 
  crearPeriodo, 
  activarPeriodo, 
  desactivarPeriodo,
  obtenerPeriodoActivo,
  actualizarPeriodo
} from '../../controllers/periodo.controller.js';
import requireAuth from '../../middlewares/requireAuth.js';
import { esAdmin } from '../../middlewares/roles.middleware.js';

const router = Router();

// Público
router.get('/', listarPeriodos);
router.get('/activo', obtenerPeriodoActivo);

// Solo administradores
router.post('/', requireAuth, esAdmin, crearPeriodo);
router.put('/:id', requireAuth, esAdmin, actualizarPeriodo);
router.patch('/:id/activar', requireAuth, esAdmin, activarPeriodo);
router.patch('/:id/desactivar', requireAuth, esAdmin, desactivarPeriodo);

export default router;