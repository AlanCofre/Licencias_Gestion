// backend/routes/estudiante.routes.js
import { Router } from 'express';
import { obtenerMisCursos } from '../../controllers/estudiante.controller.js'; // ← Ruta corregida
import { validarJWT, esEstudiante } from '../../middlewares/auth.js'; // ← Ruta corregida

const router = Router();

/**
 * @route   GET /api/estudiantes/mis-cursos
 * @desc    Obtener cursos matriculados del estudiante autenticado
 * @access  Privado (Estudiante)
 * @query   periodo (opcional) - Filtro por período específico
 */
router.get(
  '/mis-cursos',
  validarJWT,
  esEstudiante,
  obtenerMisCursos
);

export default router;