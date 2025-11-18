// src/routes/curso.route.js
import { Router } from 'express';
import { 
  crearCurso, 
  actualizarCurso, 
  listarCursos,
  obtenerCurso,
  eliminarCurso,
  cursosPorProfesor,
  cursosPorPeriodo
} from '../../controllers/curso.controller.js';
import requireAuth from '../../middlewares/requireAuth.js';
import { esAdmin } from '../../middlewares/roles.middleware.js';

const router = Router();

// Rutas públicas (si necesitas alguna)
router.get('/profesor/:id_profesor', cursosPorProfesor);
router.get('/periodo/:id_periodo', cursosPorPeriodo);

// Rutas protegidas solo para administradores
router.get('/', requireAuth, esAdmin, listarCursos);
router.get('/:id', requireAuth, esAdmin, obtenerCurso);
router.post('/', requireAuth, esAdmin, crearCurso);
router.put('/:id', requireAuth, esAdmin, actualizarCurso);
router.delete('/:id', requireAuth, esAdmin, eliminarCurso);

export default router;