// backend/controllers/profesor.controller.js
import { obtenerEstudiantesConRegularidad } from '../services/regularidad.service.js';
import db from '../config/db.js';

/**
 * Obtener estudiantes con regularidad para un profesor
 */
export const getEstudiantesConRegularidad = async (req, res) => {
  try {
    const idProfesor = req.user?.id_usuario;
    const { periodo } = req.query;

    if (!idProfesor) {
      return res.status(401).json({ ok: false, error: 'No autenticado' });
    }

    // Verificar que el usuario es profesor
    const [usuario] = await db.execute(
      'SELECT id_rol FROM usuario WHERE id_usuario = ?',
      [idProfesor]
    );

    if (!usuario.length || usuario[0].id_rol !== 1) { // 1 = profesor
      return res.status(403).json({ 
        ok: false, 
        error: 'No tiene permisos para ver esta información' 
      });
    }

    const estudiantes = await obtenerEstudiantesConRegularidad(idProfesor, periodo);

    return res.status(200).json({
      ok: true,
      data: estudiantes
    });
  } catch (error) {
    console.error('❌ Error en getEstudiantesConRegularidad:', error);
    return res.status(500).json({ 
      ok: false, 
      error: 'Error interno del servidor' 
    });
  }
};