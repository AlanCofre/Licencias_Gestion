// backend/controllers/regularidad.controller.js
import { 
  calcularRegularidadEstudiante, 
  obtenerRegularidadPorCurso,
  obtenerEstadisticasRegularidad
} from '../services/regularidad.service.js';
import db from '../config/db.js';

/**
 * Obtener regularidad de un estudiante específico
 */
export const getRegularidadEstudiante = async (req, res) => {
  try {
    const { idEstudiante } = req.params;
    const { periodo, id_curso } = req.query;

    // Validar permisos - SOLO profesor o administrador
    const rol = (req.user?.rol ?? req.rol ?? '').toString().toLowerCase();
    if (!['profesor', 'administrador'].includes(rol)) {
      return res.status(403).json({ 
        ok: false, 
        error: 'No tiene permisos para ver esta información. Se requiere rol de profesor o administrador.' 
      });
    }

    // Si es profesor, verificar que el estudiante esté en sus cursos
    if (rol === 'profesor') {
      const [acceso] = await db.execute(`
        SELECT 1 
        FROM matriculas m
        JOIN curso c ON m.id_curso = c.id_curso
        WHERE m.id_usuario = ? 
          AND c.id_usuario = ?
        LIMIT 1
      `, [idEstudiante, req.user.id_usuario]);
      
      if (acceso.length === 0) {
        return res.status(403).json({ 
          ok: false, 
          error: 'No tiene acceso a la información de este estudiante' 
        });
      }
    }

    // Administradores pueden ver cualquier estudiante sin restricción

    const regularidad = await calcularRegularidadEstudiante(
      parseInt(idEstudiante), 
      periodo, 
      id_curso ? parseInt(id_curso) : null
    );

    return res.status(200).json({
      ok: true,
      data: regularidad
    });
  } catch (error) {
    console.error('❌ Error en getRegularidadEstudiante:', error);
    return res.status(500).json({ 
      ok: false, 
      error: 'Error interno del servidor' 
    });
  }
};

/**
 * Obtener regularidad de todos los estudiantes de un curso
 */
export const getRegularidadCurso = async (req, res) => {
  try {
    const { idCurso } = req.params;
    const { periodo } = req.query;

    // Validar permisos - SOLO profesor o administrador
    const rol = (req.user?.rol ?? req.rol ?? '').toString().toLowerCase();
    if (!['profesor', 'administrador'].includes(rol)) {
      return res.status(403).json({ 
        ok: false, 
        error: 'No tiene permisos para ver esta información. Se requiere rol de profesor o administrador.' 
      });
    }

    // Verificar que el usuario tenga acceso al curso (si es profesor)
    if (rol === 'profesor') {
      const [cursosProfesor] = await db.execute(
        'SELECT id_curso FROM curso WHERE id_usuario = ? AND id_curso = ?',
        [req.user.id_usuario, idCurso]
      );
      
      if (cursosProfesor.length === 0) {
        return res.status(403).json({ 
          ok: false, 
          error: 'No tiene acceso a este curso' 
        });
      }
    }

    const regularidadCurso = await obtenerRegularidadPorCurso(
      parseInt(idCurso), 
      periodo
    );

    return res.status(200).json({
      ok: true,
      data: {
        id_curso: parseInt(idCurso),
        periodo: periodo || 'actual',
        estudiantes: regularidadCurso
      }
    });
  } catch (error) {
    console.error('❌ Error en getRegularidadCurso:', error);
    return res.status(500).json({ 
      ok: false, 
      error: 'Error interno del servidor' 
    });
  }
};

/**
 * Obtener estadísticas de regularidad (para dashboard)
 */
export const getEstadisticasRegularidad = async (req, res) => {
  try {
    const { periodo } = req.query;
    const rol = (req.user?.rol ?? req.rol ?? '').toString().toLowerCase();
    
    // Validar permisos - SOLO profesor o administrador
    if (!['profesor', 'administrador'].includes(rol)) {
      return res.status(403).json({ 
        ok: false, 
        error: 'No tiene permisos para ver esta información. Se requiere rol de profesor o administrador.' 
      });
    }

    let idProfesor = null;
    if (rol === 'profesor') {
      idProfesor = req.user.id_usuario;
    }

    const estadisticas = await obtenerEstadisticasRegularidad(idProfesor, periodo);

    return res.status(200).json({
      ok: true,
      data: estadisticas
    });
  } catch (error) {
    console.error('❌ Error en getEstadisticasRegularidad:', error);
    return res.status(500).json({ 
      ok: false, 
      error: 'Error interno del servidor' 
    });
  }
};