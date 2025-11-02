// backend/src/routes/matriculas.routes.js
import { Router } from 'express';
import {
  crearMatriculaAdmin,
  bajaMatriculaAdmin,
  listarMatriculas,
  obtenerMisMatriculas
} from '../../controllers/matricula.controller.js';
import { authMiddleware } from '../../middlewares/authMiddleware.js';
import { requireRole } from '../../middlewares/requireRole.js';

const router = Router();

// estudiante ve sus matrículas
router.get('/mis', authMiddleware, obtenerMisMatriculas);

// admin crea
router.post(
  '/',
  authMiddleware,
  requireRole('administrador'),
  crearMatriculaAdmin
);

// admin baja
router.patch(
  '/:id_matricula/baja',
  authMiddleware,
  requireRole('administrador'),
  bajaMatriculaAdmin
);

// admin lista
router.get(
  '/',
  authMiddleware,
  requireRole('administrador'),
  listarMatriculas
);

export default router;
