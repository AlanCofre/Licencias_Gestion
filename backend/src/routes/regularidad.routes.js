// backend/src/routes/regularidad.routes.js
import { Router } from 'express';
import { 
  getRegularidadEstudiante, 
  getRegularidadCurso,
  getEstadisticasRegularidad
} from '../../controllers/regularidad.controller.js'; // ← Ruta corregida
import { validarJWT, tieneRol } from '../../middlewares/auth.js';

const router = Router();

// Regularidad de un estudiante específico - SOLO profesores y administradores
router.get(
  '/estudiante/:idEstudiante', 
  validarJWT, 
  tieneRol('profesor', 'administrador'),
  getRegularidadEstudiante
);

// Regularidad de todos los estudiantes de un curso - SOLO profesores y administradores
router.get(
  '/curso/:idCurso', 
  validarJWT, 
  tieneRol('profesor', 'administrador'),
  getRegularidadCurso
);

// Estadísticas de regularidad (dashboard) - SOLO profesores y administradores
router.get(
  '/estadisticas', 
  validarJWT, 
  tieneRol('profesor', 'administrador'),
  getEstadisticasRegularidad
);

export default router;