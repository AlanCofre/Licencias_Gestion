// backend/src/routes/matriculas.routes.js
import { Router } from 'express';
import {
  crearMatriculaAdmin,
  bajaMatriculaAdmin,
  listarMatriculas,
  obtenerMisMatriculas
} from '../../controllers/matricula.controller.js';
import requireAuth from '../../middlewares/requireAuth.js';
// si tienes este helper de roles, lo dejas, si no, lo quitamos:
import { requireRole } from '../../middlewares/requireRole.js';

const router = Router();

// estudiante ve sus matrículas
router.get('/mismatriculas', requireAuth, obtenerMisMatriculas);

// admin crea
router.post(
  '/',
  requireAuth,
  requireRole ? requireRole('administrador') : (req, res, next) => next(),
  crearMatriculaAdmin
);

// admin baja
router.patch(
  '/:id_matricula/baja',
  requireAuth,
  requireRole ? requireRole('administrador') : (req, res, next) => next(),
  bajaMatriculaAdmin
);

// admin lista
router.get(
  '/',
  requireAuth,
  requireRole ? requireRole('administrador') : (req, res, next) => next(),
  listarMatriculas
);

export default router;
