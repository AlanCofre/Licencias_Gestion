// backend/controllers/matricula.controller.js
import { Matricula, Curso, Usuario} from '../src/models/index.js';
import Periodo from '../src/models/modelo_Periodo.js';
// helper simple de respuestas
function ok(res, data, mensaje = 'OK') {
  return res.status(200).json({ ok: true, mensaje, data });
}

function fail(res, mensaje = 'Error en la solicitud', status = 400, extra = {}) {
  return res.status(status).json({ ok: false, mensaje, ...extra });
}

/**
 * 1) ESTUDIANTE: obtener mis matrículas
 */
export const obtenerMisMatriculas = async (req, res) => {
  try {
    const usuarioId = req.user?.id_usuario || req.user?.id;
    const { periodo, flat } = req.query;

    if (!usuarioId) {
      return fail(res, 'No autenticado', 401);
    }

    // obtener usuario
    const usuario = await Usuario.findByPk(usuarioId);
    if (!usuario) {
      return fail(res, 'Usuario no encontrado', 404);
    }

    // solo estudiantes (id_rol = 2 en tu BD)
    if (usuario.id_rol !== 2) {
      return fail(res, 'Solo estudiantes pueden acceder a esta información', 403);
    }

    // armar where
    const whereConditions = { id_usuario: usuarioId };
    
    // Si se filtra por período, usar la relación con Curso -> Periodo
    if (periodo) {
      whereConditions['$curso.id_periodo$'] = periodo;
    }

    const matriculas = await Matricula.findAll({
      where: whereConditions,
      include: [
        {
          model: Curso,
          attributes: ['id_curso', 'codigo', 'nombre_curso', 'seccion', 'semestre', 'id_periodo'],
          include: [
            {
              model: Usuario,
              as: 'profesor',
              attributes: ['id_usuario', 'nombre'],
            },
            {
              model: Periodo,
              attributes: ['id_periodo', 'codigo', 'activo']
            }
          ],
        },
      ],
      order: [
        ['curso', 'Periodo', 'codigo', 'DESC'],
        ['curso', 'nombre_curso', 'ASC'],
        ['curso', 'seccion', 'ASC'],
      ],
    });

    // sin cursos
    if (!matriculas.length) {
      return ok(res, flat ? [] : {}, 'No tienes cursos matriculados');
    }

    // modo plano
    if (flat === 'true') {
      const cursosPlano = matriculas.map((m) => ({
        id_matricula: m.id_matricula,
        fecha_matricula: m.fecha_matricula,
        id_curso: m.curso.id_curso,
        codigo: m.curso.codigo,
        nombre_curso: m.curso.nombre_curso,
        seccion: m.curso.seccion,
        semestre: m.curso.semestre,
        periodo: m.curso.Periodo?.codigo,
        id_periodo: m.curso.id_periodo,
        periodo_activo: m.curso.Periodo?.activo,
        profesor: m.curso.profesor,
        activo: m.curso.activo,
      }));
      return ok(res, cursosPlano);
    }

    // agrupado por periodo
    const agrupadoPorPeriodo = {};
    matriculas.forEach((m) => {
      const curso = m.curso;
      const periodoCurso = curso.Periodo?.codigo;
      const idPeriodo = curso.id_periodo;

      if (!periodoCurso) return;

      if (!agrupadoPorPeriodo[periodoCurso]) {
        agrupadoPorPeriodo[periodoCurso] = {
          periodo: periodoCurso,
          id_periodo: idPeriodo,
          es_periodo_actual: curso.Periodo?.activo || false,
          cursos: [],
        };
      }

      agrupadoPorPeriodo[periodoCurso].cursos.push({
        id_curso: curso.id_curso,
        codigo: curso.codigo,
        nombre_curso: curso.nombre_curso,
        seccion: curso.seccion,
        semestre: curso.semestre,
        activo: curso.activo,
        profesor: curso.profesor,
      });
    });

    const periodosOrdenados = Object.values(agrupadoPorPeriodo).sort((a, b) =>
      b.periodo.localeCompare(a.periodo)
    );

    return ok(res, periodosOrdenados);
  } catch (error) {
    console.error('❌ Error al obtener matrículas:', error);
    return fail(res, 'Error interno al obtener matrículas', 500);
  }
};

/**
 * 2) ADMIN: crear matrícula (alta)
 */
export const crearMatriculaAdmin = async (req, res) => {
  try {
    const { id_usuario, id_curso } = req.body;

    if (!id_usuario || !id_curso) {
      return fail(res, 'Faltan datos: id_usuario, id_curso');
    }

    const usuario = await Usuario.findByPk(id_usuario);
    if (!usuario) {
      return fail(res, 'Usuario no encontrado', 404);
    }

    // solo estudiantes
    if (usuario.id_rol !== 2) {
      return fail(res, 'Solo se pueden matricular usuarios con rol estudiante');
    }

    const curso = await Curso.findByPk(id_curso);
    if (!curso) {
      return fail(res, 'Curso no encontrado', 404);
    }

    // ver duplicado
    const existe = await Matricula.findOne({
      where: { id_usuario, id_curso },
    });

    if (existe) {
      return fail(res, 'El estudiante ya está matriculado en este curso', 409);
    }

    const nueva = await Matricula.create({
      id_usuario,
      id_curso,
      fecha_matricula: new Date(),
    });

    // Obtener matrícula completa con relaciones
    const matriculaCompleta = await Matricula.findByPk(nueva.id_matricula, {
      include: [
        {
          model: Usuario,
          attributes: ['id_usuario', 'nombre', 'correo_usuario', 'id_rol']
        },
        {
          model: Curso,
          include: [
            {
              model: Periodo,
              attributes: ['id_periodo', 'codigo', 'activo']
            }
          ]
        }
      ]
    });

    return res.status(201).json({
      ok: true,
      mensaje: 'Matrícula creada correctamente',
      data: matriculaCompleta,
    });
  } catch (error) {
    console.error('[matriculas] crear admin', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return fail(res, 'El estudiante ya está matriculado en este curso', 409);
    }
    
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return fail(res, 'Error de referencia: El usuario o curso no existe', 400);
    }
    
    return fail(res, 'Error interno al crear matrícula', 500);
  }
};

/**
 * 3) ADMIN: eliminar matrícula
 */
export const eliminarMatricula = async (req, res) => {
  try {
    const { id_matricula } = req.params;

    const matricula = await Matricula.findByPk(id_matricula);
    if (!matricula) {
      return fail(res, 'Matrícula no encontrada', 404);
    }

    await matricula.destroy();

    return ok(res, null, 'Matrícula eliminada correctamente');
  } catch (error) {
    console.error('[matriculas] eliminar', error);
    return fail(res, 'Error interno al eliminar matrícula', 500);
  }
};

/**
 * 4) ADMIN: listar todas las matrículas
 */
export const listarMatriculas = async (req, res) => {
  try {
    const { id_curso, id_periodo } = req.query;

    const where = {};
    if (id_curso) where.id_curso = id_curso;

    // Si se filtra por período, usar la relación con Curso
    let cursoInclude = {
      model: Curso,
      include: [
        {
          model: Periodo,
          attributes: ['id_periodo', 'codigo', 'activo']
        }
      ]
    };

    if (id_periodo) {
      cursoInclude.where = { id_periodo };
    }

    const matriculas = await Matricula.findAll({
      where,
      include: [
        {
          model: Usuario,
          attributes: ['id_usuario', 'nombre', 'correo_usuario', 'id_rol']
        },
        cursoInclude
      ],
      order: [['fecha_matricula', 'DESC']]
    });

    return ok(res, matriculas);
  } catch (error) {
    console.error('[matriculas] listar error:', error);
    return fail(res, 'Error interno al listar matrículas', 500);
  }
};

/**
 * 5) ADMIN: matrículas por curso
 */
export const matriculasPorCurso = async (req, res) => {
  try {
    const { id_curso } = req.params;

    const curso = await Curso.findByPk(id_curso, {
      include: [
        {
          model: Periodo,
          attributes: ['id_periodo', 'codigo', 'activo']
        }
      ]
    });

    if (!curso) {
      return fail(res, 'Curso no encontrado', 404);
    }

    const matriculas = await Matricula.findAll({
      where: { id_curso },
      include: [
        {
          model: Usuario,
          attributes: ['id_usuario', 'nombre', 'correo_usuario', 'id_rol']
        }
      ],
      order: [['fecha_matricula', 'DESC']]
    });

    return ok(res, {
      curso,
      matriculas,
      total: matriculas.length
    });

  } catch (error) {
    console.error('[matriculas] por curso error:', error);
    return fail(res, 'Error interno al obtener matrículas del curso', 500);
  }
};

export default {
  obtenerMisMatriculas,
  crearMatriculaAdmin,
  eliminarMatricula,
  listarMatriculas,
  matriculasPorCurso
};