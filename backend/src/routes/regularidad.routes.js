// backend/src/routes/regularidad.routes.js
import { Router } from 'express';
import { 
  getRegularidadEstudiante, 
  getRegularidadCurso,
  getEstadisticasRegularidad
} from '../../controllers/regularidad.controller.js';
import { getEstudiantesConRegularidad } from '../../controllers/profesor.controller.js';
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

// Estudiantes con regularidad para profesor
router.get(
  '/profesor/estudiantes',
  validarJWT,
  tieneRol('profesor', 'administrador'),
  getEstudiantesConRegularidad
);

// Estadísticas de regularidad (dashboard) - SOLO profesores y administradores
router.get(
  '/estadisticas', 
  validarJWT, 
  tieneRol('profesor', 'administrador'),
  getEstadisticasRegularidad
);

export default router;