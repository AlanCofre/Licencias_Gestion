// controllers/curso.controller.js
import Curso from '../src/models/modelo_Curso.js';
import Usuario from '../src/models/modelo_Usuario.js';
import Periodo from '../src/models/modelo_Periodo.js';

const ROL_PROFESOR = 'profesor';
const ROL_ADMIN = 'administrador';
const ID_ROL_PROFESOR = 1; // Según tu BD: 1 = profesor

// helper simple de respuestas
function ok(res, data, mensaje = 'OK') {
  return res.status(200).json({ ok: true, mensaje, data });
}

function fail(res, mensaje = 'Error en la solicitud', status = 400, extra = {}) {
  return res.status(status).json({ ok: false, mensaje, ...extra });
}

// === POST /cursos  (crear curso - solo admin) ===
export const crearCurso = async (req, res) => {
  try {
    // 👈 CORREGIDO: usar 'codigo' en lugar de 'codigo_curso'
    const { codigo, nombre_curso, semestre, seccion, id_periodo, id_usuario } = req.body;

    if (!codigo || !nombre_curso || !semestre || !seccion || !id_periodo || !id_usuario) {
      return fail(res, 'Faltan datos obligatorios: (codigo, nombre_curso, semestre, seccion, id_periodo, id_usuario)');
    }

    // Validar que el periodo existe
    const periodo = await Periodo.findByPk(id_periodo);
    if (!periodo) return fail(res, 'El período académico indicado no existe', 404);

    // Validar que el usuario asignado sea profesor
    const profesor = await Usuario.findByPk(id_usuario);
    if (!profesor) return fail(res, 'El profesor indicado no existe', 404);
    if (profesor.id_rol !== ID_ROL_PROFESOR) {
      return fail(res, 'El usuario indicado no tiene rol de profesor', 400);
    }

    // Validar unicidad (codigo + seccion + id_periodo)
    const existe = await Curso.findOne({ 
      where: { codigo, seccion, id_periodo } // 👈 CORREGIDO: usar 'codigo'
    });
    if (existe) return fail(res, 'Ya existe un curso con ese código, sección y período', 409);

    const nuevo = await Curso.create({ 
      codigo, // 👈 CORREGIDO: usar 'codigo'
      nombre_curso, 
      semestre, 
      seccion, 
      id_periodo, 
      id_usuario 
    });

    // Obtener el curso creado con relaciones para la respuesta
    const cursoCompleto = await Curso.findByPk(nuevo.id_curso, {
      include: [
        { 
          model: Usuario, 
          attributes: ['id_usuario', 'nombre', 'correo_usuario', 'id_rol'] 
        },
        {
          model: Periodo,
          attributes: ['id_periodo', 'codigo', 'activo']
        }
      ]
    });

    return res.status(201).json({ 
      ok: true, 
      mensaje: 'Curso creado correctamente', 
      data: cursoCompleto 
    });

  } catch (err) {
    console.error('[cursos] error creando curso:', err);
    if (err.name === 'SequelizeUniqueConstraintError') {
      return fail(res, 'Ya existe un curso con ese código, sección y período', 409);
    }
    if (err.name === 'SequelizeForeignKeyConstraintError') {
      return fail(res, 'Error de referencia: El período o profesor no existe', 400);
    }
    return fail(res, 'Error interno al crear el curso', 500, { error: err.message });
  }
};

// === PUT /cursos/:id  (editar curso - solo admin) ===
export const actualizarCurso = async (req, res) => {
  try {
    const { id } = req.params;
    // 👈 CORREGIDO: usar 'codigo' en lugar de 'codigo_curso'
    const { codigo, nombre_curso, semestre, seccion, id_periodo, id_usuario } = req.body;

    const curso = await Curso.findByPk(id, {
      include: [
        { model: Usuario },
        { model: Periodo }
      ]
    });
    if (!curso) return fail(res, 'Curso no encontrado', 404);

    // Validar periodo si se está actualizando
    if (id_periodo) {
      const periodo = await Periodo.findByPk(id_periodo);
      if (!periodo) return fail(res, 'El período académico indicado no existe', 404);
    }

    // Validar profesor si se está actualizando
    if (id_usuario) {
      const profesor = await Usuario.findByPk(id_usuario);
      if (!profesor) return fail(res, 'El profesor indicado no existe', 404);
      if (profesor.id_rol !== ID_ROL_PROFESOR) {
        return fail(res, 'El usuario indicado no tiene rol de profesor', 400);
      }
    }

    const codigoFinal = codigo ?? curso.codigo;
    const seccionFinal = seccion ?? curso.seccion;
    const periodoFinal = id_periodo ?? curso.id_periodo;

    // Validar unicidad (excluyendo el curso actual)
    const existe = await Curso.findOne({ 
      where: { 
        codigo: codigoFinal, // 👈 CORREGIDO: usar 'codigo'
        seccion: seccionFinal, 
        id_periodo: periodoFinal 
      } 
    });
    if (existe && existe.id_curso !== curso.id_curso) {
      return fail(res, 'Ya existe otro curso con ese código, sección y período', 409);
    }

    // Actualizar campos
    curso.codigo = codigoFinal; // 👈 CORREGIDO: usar 'codigo'
    curso.nombre_curso = nombre_curso ?? curso.nombre_curso;
    curso.semestre = semestre ?? curso.semestre;
    curso.seccion = seccionFinal;
    curso.id_periodo = periodoFinal;
    if (id_usuario) curso.id_usuario = id_usuario;

    await curso.save();

    // Recargar el curso con relaciones actualizadas
    await curso.reload({
      include: [
        { 
          model: Usuario, 
          attributes: ['id_usuario', 'nombre', 'correo_usuario', 'id_rol'] 
        },
        {
          model: Periodo,
          attributes: ['id_periodo', 'codigo', 'activo']
        }
      ]
    });

    return ok(res, curso, 'Curso actualizado correctamente');

  } catch (err) {
    console.error('[cursos] error actualizando curso:', err);
    if (err.name === 'SequelizeUniqueConstraintError') {
      return fail(res, 'Ya existe un curso con ese código, sección y período', 409);
    }
    if (err.name === 'SequelizeForeignKeyConstraintError') {
      return fail(res, 'Error de referencia: El período o profesor no existe', 400);
    }
    return fail(res, 'Error interno al actualizar el curso', 500, { error: err.message });
  }
};

// === GET /cursos  (listar cursos - admin) ===
export const listarCursos = async (req, res) => {
  try {
    const { id_periodo, id_profesor } = req.query;
    
    // Construir condiciones WHERE
    const whereConditions = {};
    
    if (id_periodo) {
      whereConditions.id_periodo = id_periodo;
    }
    
    if (id_profesor) {
      whereConditions.id_usuario = id_profesor;
    }

    const cursos = await Curso.findAll({
      where: whereConditions,
      include: [
        { 
          model: Usuario, 
          attributes: ['id_usuario', 'nombre', 'correo_usuario', 'id_rol'] 
        },
        {
          model: Periodo,
          attributes: ['id_periodo', 'codigo', 'activo'],
          as: 'periodo'
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

// === GET /cursos/:id  (obtener curso por ID) ===
export const obtenerCurso = async (req, res) => {
  try {
    const { id } = req.params;
    const curso = await Curso.findByPk(id, {
      include: [
        { 
          model: Usuario, 
          attributes: ['id_usuario', 'nombre', 'correo_usuario', 'id_rol'] 
        },
        {
          model: Periodo,
          attributes: ['id_periodo', 'codigo', 'activo']
        }
      ]
    });

    if (!curso) return fail(res, 'Curso no encontrado', 404);
    return ok(res, curso);

  } catch (err) {
    console.error('[cursos] error obteniendo curso:', err);
    return fail(res, 'Error interno al obtener el curso', 500);
  }
};

// === DELETE /cursos/:id  (eliminar curso - solo admin) ===
export const eliminarCurso = async (req, res) => {
  try {
    const { id } = req.params;
    const curso = await Curso.findByPk(id);

    if (!curso) return fail(res, 'Curso no encontrado', 404);

    await curso.destroy();
    return ok(res, null, 'Curso eliminado correctamente');

  } catch (err) {
    console.error('[cursos] error eliminando curso:', err);
    
    // Manejar error de clave foránea (si hay matrículas asociadas)
    if (err.name === 'SequelizeForeignKeyConstraintError') {
      return fail(res, 'No se puede eliminar el curso porque tiene matrículas asociadas', 400);
    }
    
    return fail(res, 'Error interno al eliminar el curso', 500, { error: err.message });
  }
};

// === GET /cursos/profesor/:id_profesor  (cursos por profesor) ===
export const cursosPorProfesor = async (req, res) => {
  try {
    const { id_profesor } = req.params;
    
    const cursos = await Curso.findAll({
      where: { id_usuario: id_profesor },
      include: [
        {
          model: Periodo,
          attributes: ['id_periodo', 'codigo', 'activo']
        }
      ],
      order: [['codigo', 'ASC']] // 👈 CORREGIDO: usar 'codigo'
    });

    return ok(res, cursos);

  } catch (err) {
    console.error('[cursos] error obteniendo cursos por profesor:', err);
    return fail(res, 'Error interno al obtener cursos del profesor', 500);
  }
};

// === GET /cursos/periodo/:id_periodo  (cursos por período) ===
export const cursosPorPeriodo = async (req, res) => {
  try {
    const { id_periodo } = req.params;
    
    // Verificar que el periodo existe
    const periodo = await Periodo.findByPk(id_periodo);
    if (!periodo) return fail(res, 'Período académico no encontrado', 404);

    const cursos = await Curso.findAll({
      where: { id_periodo },
      include: [
        { 
          model: Usuario, 
          attributes: ['id_usuario', 'nombre', 'correo_usuario', 'id_rol'] 
        }
      ],
      order: [['codigo', 'ASC']] // 👈 CORREGIDO: usar 'codigo'
    });

    return ok(res, cursos);

  } catch (err) {
    console.error('[cursos] error obteniendo cursos por período:', err);
    return fail(res, 'Error interno al obtener cursos del período', 500);
  }
};