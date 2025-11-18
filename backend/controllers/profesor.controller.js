// backend/controllers/profesor.controller.js
import { obtenerEstudiantesConRegularidad } from '../services/regularidad.service.js';
import db from '../config/db.js';
import { LicenciaMedica, Curso, Usuario, LicenciasEntregas, Periodo } from '../src/models/index.js';
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

export const obtenerLicenciasProfesor = async (req, res) => {
  const idProfesor = req.user.id_usuario;
  const { periodo } = req.query;

  try {
    // Verificar que el usuario es profesor
    if (req.user.rol !== 'profesor') {
      return res.status(403).json({ 
        ok: false, 
        mensaje: 'Acceso denegado. Solo para profesores.' 
      });
    }

    // Obtener cursos del profesor
    const cursosProfesor = await Curso.findAll({
      where: { id_usuario: idProfesor },
      attributes: ['id_curso', 'codigo', 'nombre_curso', 'seccion']
    });

    if (cursosProfesor.length === 0) {
      return res.json({
        ok: true,
        data: [],
        mensaje: 'No tienes cursos asignados'
      });
    }

    const idsCursos = cursosProfesor.map(curso => curso.id_curso);

    // Obtener entregas de licencias para los cursos del profesor
    const entregas = await LicenciasEntregas.findAll({
      where: { id_curso: idsCursos },
      include: [
        {
          model: LicenciaMedica,
          as: 'licencia',
          attributes: ['id_licencia', 'folio', 'fecha_emision', 'fecha_inicio', 'fecha_fin', 'estado', 'id_usuario'],
          include: [
            {
              model: Usuario,
              as: 'solicitante',
              attributes: ['id_usuario', 'nombre', 'correo_usuario']
            }
          ]
        },
        {
          model: Curso,
          as: 'curso',
          attributes: ['id_curso', 'codigo', 'nombre_curso', 'seccion']
        }
      ],
      order: [['fecha_creacion', 'DESC']]
    });

    // Formatear respuesta
    const licenciasFormateadas = entregas.map(entrega => ({
      id_licencia: entrega.licencia.id_licencia,
      id_entrega: entrega.id_entrega,
      nombre_estudiante: entrega.licencia.solicitante?.nombre || 'Sin nombre',
      correo_estudiante: entrega.licencia.solicitante?.correo_usuario || 'Sin email',
      codigo_curso: entrega.curso.codigo,
      nombre_curso: entrega.curso.nombre_curso,
      seccion: entrega.curso.seccion,
      fecha_emision: entrega.licencia.fecha_emision,
      fecha_inicio: entrega.licencia.fecha_inicio,
      fecha_fin: entrega.licencia.fecha_fin,
      estado: entrega.licencia.estado,
      folio: entrega.licencia.folio
    }));

    res.json({
      ok: true,
      data: licenciasFormateadas,
      total: licenciasFormateadas.length
    });

  } catch (error) {
    console.error('💥 Error en obtenerLicenciasProfesor:', error);
    res.status(500).json({ 
      ok: false, 
      mensaje: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};