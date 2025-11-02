// backend/controllers/matricula.controller.js
import { Matricula, Curso, Usuario, Rol } from '../src/models/index.js';

/**
 * 1) ESTUDIANTE: obtener mis matrículas
 */
export const obtenerMisMatriculas = async (req, res) => {
  try {
    const usuarioId = req.user?.id_usuario || req.user?.id;
    const { periodo, flat } = req.query;

    if (!usuarioId) {
      return res.status(401).json({ ok: false, error: 'No autenticado' });
    }

    // obtener usuario + rol
    const usuario = await Usuario.findByPk(usuarioId, {
      include: [
        {
          model: Rol,
          attributes: ['id_rol', 'nombre_rol'],
        },
      ],
    });

    if (!usuario) {
      return res.status(404).json({ ok: false, error: 'Usuario no encontrado' });
    }

    // solo estudiantes (id_rol = 2 en tu BD)
    if (usuario.id_rol !== 2) {
      return res.status(403).json({
        ok: false,
        error: 'Solo estudiantes pueden acceder a esta información',
        rol_actual: { id_rol: usuario.id_rol, nombre_rol: usuario.Rol?.nombre_rol },
      });
    }

    // armar where
    const whereConditions = { id_usuario: usuarioId };
    if (periodo) {
      // ojo: esto depende de que Curso tenga campo "periodo"
      whereConditions['$curso.periodo$'] = periodo;
    }

    const matriculas = await Matricula.findAll({
      where: whereConditions,
      include: [
        {
          model: Curso,
          as: 'curso',
          attributes: ['id_curso', 'codigo', 'nombre_curso', 'seccion', 'periodo', 'activo'],
          include: [
            {
              model: Usuario,
              as: 'profesor',
              attributes: ['id_usuario', 'nombre'],
            },
          ],
        },
      ],
      order: [
        ['curso', 'periodo', 'DESC'],
        ['curso', 'nombre_curso', 'ASC'],
        ['curso', 'seccion', 'ASC'],
      ],
    });

    // sin cursos
    if (!matriculas.length) {
      return res.json({
        ok: true,
        mensaje: 'No tienes cursos matriculados',
        data: flat ? [] : {},
      });
    }

    // modo plano
    if (flat === 'true') {
      const cursosPlano = matriculas.map((m) => ({
        id_matricula: m.id_matricula,
        fecha_matricula: m.fecha_matricula,
        ...m.curso.toJSON(),
      }));
      return res.json({ ok: true, data: cursosPlano });
    }

    // agrupado por periodo
    const agrupadoPorPeriodo = {};
    matriculas.forEach((m) => {
      const curso = m.curso;
      const periodoCurso = curso.periodo;

      if (!agrupadoPorPeriodo[periodoCurso]) {
        agrupadoPorPeriodo[periodoCurso] = {
          periodo: periodoCurso,
          es_periodo_actual: esPeriodoActual(periodoCurso),
          cursos: [],
        };
      }

      agrupadoPorPeriodo[periodoCurso].cursos.push({
        id_curso: curso.id_curso,
        codigo: curso.codigo,
        nombre_curso: curso.nombre_curso,
        seccion: curso.seccion,
        activo: curso.activo,
        profesor: curso.profesor,
      });
    });

    const periodosOrdenados = Object.values(agrupadoPorPeriodo).sort((a, b) =>
      b.periodo.localeCompare(a.periodo)
    );

    return res.json({
      ok: true,
      data: periodosOrdenados,
    });
  } catch (error) {
    console.error('❌ Error al obtener matrículas:', error);
    return res.status(500).json({
      ok: false,
      error: 'Error interno al obtener matrículas',
    });
  }
};

/**
 * 2) ADMIN: crear matrícula (alta)
 */
export const crearMatriculaAdmin = async (req, res) => {
  try {
    const { id_usuario, id_curso, id_periodo } = req.body;

    if (!id_usuario || !id_curso || !id_periodo) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Faltan datos: id_usuario, id_curso o id_periodo',
      });
    }

    const usuario = await Usuario.findByPk(id_usuario);
    if (!usuario) {
      return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado' });
    }

    // solo estudiantes
    if (usuario.id_rol !== 2) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Solo se pueden matricular usuarios con rol estudiante',
      });
    }

    const curso = await Curso.findByPk(id_curso);
    if (!curso) {
      return res.status(404).json({ ok: false, mensaje: 'Curso no encontrado' });
    }

    // ver duplicado
    const existe = await Matricula.findOne({
      where: { id_usuario, id_curso, id_periodo },
    });

    if (existe) {
      if (existe.estado === 'baja') {
        existe.estado = 'activa';
        await existe.save();
        return res.json({
          ok: true,
          mensaje: 'Matrícula reactivada',
          data: existe,
        });
      }

      return res.status(409).json({
        ok: false,
        mensaje: 'El estudiante ya está matriculado en este curso y período',
      });
    }

    const nueva = await Matricula.create({
      id_usuario,
      id_curso,
      id_periodo,
      estado: 'activa',
    });

    return res.status(201).json({
      ok: true,
      mensaje: 'Matrícula creada correctamente',
      data: nueva,
    });
  } catch (error) {
    console.error('[matriculas] crear admin', error);
    return res.status(500).json({
      ok: false,
      mensaje: 'Error interno al crear matrícula',
      error: error.message,
    });
  }
};

/**
 * 3) ADMIN: baja
 */
export const bajaMatriculaAdmin = async (req, res) => {
  try {
    const { id_matricula } = req.params;

    const matricula = await Matricula.findByPk(id_matricula);
    if (!matricula) {
      return res.status(404).json({ ok: false, mensaje: 'Matrícula no encontrada' });
    }

    matricula.estado = 'baja';
    await matricula.save();

    return res.json({ ok: true, mensaje: 'Matrícula dada de baja' });
  } catch (error) {
    console.error('[matriculas] baja admin', error);
    return res.status(500).json({
      ok: false,
      mensaje: 'Error interno al dar de baja matrícula',
    });
  }
};

/**
 * 4) ADMIN: listar
 */
export const listarMatriculas = async (req, res) => {
  try {
    const { id_curso, id_periodo, solo_activas } = req.query;
    const where = {};
    if (id_curso) where.id_curso = id_curso;
    if (id_periodo) where.id_periodo = id_periodo;
    if (solo_activas === 'true') where.estado = 'activa';

    const matriculas = await Matricula.findAll({
      where,
      include: [
        { model: Usuario, as: 'estudiante', attributes: ['id_usuario', 'nombre', 'apellido'] },
        { model: Curso, as: 'curso', attributes: ['id_curso', 'codigo', 'nombre_curso', 'seccion'] },
      ],
      order: [['fecha_matricula', 'DESC']],
    });

    return res.json({ ok: true, data: matriculas });
  } catch (error) {
    console.error('[matriculas] listar admin', error);
    return res.status(500).json({ ok: false, mensaje: 'Error interno al listar' });
  }
};

// helper
function esPeriodoActual(periodo) {
  try {
    const [year, semester] = periodo.split('-');
    const ahora = new Date();
    const añoActual = ahora.getFullYear();
    const semestreActual = ahora.getMonth() < 6 ? 1 : 2;
    return parseInt(year) === añoActual && parseInt(semester) === semestreActual;
  } catch {
    return false;
  }
}
