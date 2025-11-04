import { LicenciasEntregas, Curso } from '../src/models/index.js';

const validarPropietarioCurso = async (req, res, next) => {
  const idEntrega = req.params.id;
  const idProfesor = req.user?.id_usuario;

  if (!idProfesor) {
    return res.status(401).json({ error: 'Usuario no autenticado.' });
  }

  try {
    const entrega = await LicenciasEntregas.findByPk(idEntrega, {
      include: {
        model: Curso,
        as: 'curso',
        attributes: ['id_usuario']
      }
    });

    if (!entrega) {
      return res.status(404).json({ error: 'Entrega no encontrada.' });
    }

    if (entrega.curso.id_usuario !== idProfesor) {
      return res.status(403).json({ error: 'No autorizado para ver esta entrega.' });
    }

    next();
  } catch (error) {
    console.error('💥 Error en validarPropietarioCurso:', error);
    res.status(500).json({ error: 'Error interno al validar propiedad del curso.' });
  }
};

export default validarPropietarioCurso;
