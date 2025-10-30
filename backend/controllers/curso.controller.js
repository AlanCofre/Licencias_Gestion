// controllers/curso.controller.js
import Curso from '../src/models/modelo_Curso.js';
import Usuario from '../src/models/modelo_Usuario.js';

// IDs reales en tu BD
const ROL_PROFESOR = 1;
const ROL_ADMIN = 4;

// helper simple de respuestas
function ok(res, data, mensaje = 'OK') {
  return res.status(200).json({ ok: true, mensaje, data });
}

function fail(res, mensaje = 'Error en la solicitud', status = 400, extra = {}) {
  return res.status(status).json({ ok: false, mensaje, ...extra });
}

// === POST /cursos  (crear) ===
export const crearCurso = async (req, res) => {
  try {
    const {
      codigo,
      nombre_curso,
      semestre,
      seccion,
      periodo,
      id_usuario // profesor asignado
    } = req.body;

    if (!codigo || !nombre_curso || !semestre || !seccion || !periodo || !id_usuario) {
      return fail(res, 'Faltan datos obligatorios: (codigo, nombre_curso, semestre, seccion, periodo, id_usuario)');
    }

    // validar profesor
    const profesor = await Usuario.findByPk(id_usuario);
    if (!profesor) {
      return fail(res, 'El profesor indicado no existe', 404);
    }
    if (profesor.id_rol !== ROL_PROFESOR) {
      return fail(res, 'El usuario indicado no tiene rol de profesor', 400);
    }

    // validar unicidad
    const existe = await Curso.findOne({
      where: { codigo, seccion, periodo }
    });
    if (existe) {
      return fail(res, 'Ya existe un curso con ese código, sección y período', 409);
    }

    const nuevo = await Curso.create({
      codigo,
      nombre_curso,
      semestre,
      seccion,
      periodo,
      id_usuario
    });

    return res.status(201).json({
      ok: true,
      mensaje: 'Curso creado correctamente',
      data: nuevo
    });
  } catch (err) {
    console.error('[cursos] error creando curso:', err);
    if (err.name === 'SequelizeUniqueConstraintError') {
      return fail(res, 'Ya existe un curso con ese código, sección y período', 409);
    }
    return fail(res, 'Error interno al crear el curso', 500, { error: err.message });
  }
};

// === PUT /cursos/:id  (editar) ===
export const actualizarCurso = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      codigo,
      nombre_curso,
      semestre,
      seccion,
      periodo,
      id_usuario // profesor nuevo
    } = req.body;

    const curso = await Curso.findByPk(id);
    if (!curso) {
      return fail(res, 'Curso no encontrado', 404);
    }

    // si mandan un profesor nuevo, validarlo
    if (id_usuario) {
      const profesor = await Usuario.findByPk(id_usuario);
      if (!profesor) {
        return fail(res, 'El profesor indicado no existe', 404);
      }
      if (profesor.id_rol !== ROL_PROFESOR) {
        return fail(res, 'El usuario indicado no tiene rol de profesor', 400);
      }
    }

    // comprobar unicidad excluyéndome
    const codigoFinal = codigo ?? curso.codigo;
    const seccionFinal = seccion ?? curso.seccion;
    const periodoFinal = periodo ?? curso.periodo;

    const existe = await Curso.findOne({
      where: {
        codigo: codigoFinal,
        seccion: seccionFinal,
        periodo: periodoFinal
      }
    });

    if (existe && existe.id_curso !== curso.id_curso) {
      return fail(res, 'Ya existe otro curso con ese código, sección y período', 409);
    }

    // actualizar
    curso.codigo = codigoFinal;
    curso.nombre_curso = nombre_curso ?? curso.nombre_curso;
    curso.semestre = semestre ?? curso.semestre;
    curso.seccion = seccionFinal;
    curso.periodo = periodoFinal;
    if (id_usuario) curso.id_usuario = id_usuario;

    await curso.save();

    return ok(res, curso, 'Curso actualizado correctamente');
  } catch (err) {
    console.error('[cursos] error actualizando curso:', err);
    if (err.name === 'SequelizeUniqueConstraintError') {
      return fail(res, 'Ya existe un curso con ese código, sección y período', 409);
    }
    return fail(res, 'Error interno al actualizar el curso', 500, { error: err.message });
  }
};

// === GET /cursos  (admin) ===
export const listarCursos = async (req, res) => {
  try {
    const cursos = await Curso.findAll({
      include: [
        {
          model: Usuario,
          as: 'profesor',
          attributes: ['id_usuario', 'nombre', 'correo', 'id_rol']
        }
      ],
      order: [['codigo', 'ASC']]
    });
    return ok(res, cursos);
  } catch (err) {
    console.error('[cursos] error listando cursos:', err);
    return fail(res, 'Error interno al listar cursos', 500);
  }
};
