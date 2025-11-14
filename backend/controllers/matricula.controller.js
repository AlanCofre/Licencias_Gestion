// backend/controllers/matricula.controller.js
import { Matricula, Curso, Usuario, Rol } from '../src/models/index.js';


export const obtenerMisMatriculas = async (req, res) => {
  try {
    console.log('🔍 [obtenerMisMatriculas] Iniciando...');
    console.log('👤 Usuario autenticado:', req.user);
    
    const usuarioId = req.user?.id_usuario || req.user?.id;
    const { periodo, flat } = req.query;

    console.log('📝 Parámetros:', { usuarioId, periodo, flat });

    if (!usuarioId) {
      console.log('❌ No autenticado');
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
      console.log('❌ Usuario no encontrado:', usuarioId);
      return res.status(404).json({ ok: false, error: 'Usuario no encontrado' });
    }

    console.log('🎯 Rol del usuario:', usuario.id_rol, usuario.Rol?.nombre_rol);

    // solo estudiantes (id_rol = 2 en tu BD)
    if (usuario.id_rol !== 2) {
      console.log('❌ No es estudiante, rol actual:', usuario.id_rol);
      return res.status(403).json({
        ok: false,
        error: 'Solo estudiantes pueden acceder a esta información',
        rol_actual: { id_rol: usuario.id_rol, nombre_rol: usuario.Rol?.nombre_rol },
      });
    }

    // armar where - ahora el periodo está en matricula.periodo
    const whereConditions = { id_usuario: usuarioId };
    if (periodo) {
      whereConditions.periodo = periodo;
    }

    const matriculas = await Matricula.findAll({
      where: whereConditions,
      include: [
        {
          model: Curso,
          as: 'curso',
          attributes: ['id_curso', 'codigo', 'nombre_curso', 'seccion', 'activo'],
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
        ['periodo', 'DESC'],
        ['curso', 'nombre_curso', 'ASC'],
        ['curso', 'seccion', 'ASC'],
      ],
    });

    console.log('📊 Matrículas encontradas:', matriculas.length);

    // sin cursos
    if (!matriculas.length) {
      console.log('ℹ️ No hay matrículas para el usuario');
      return res.json({
        ok: true,
        mensaje: 'No tienes cursos matriculados',
        data: [],
      });
    }

    // modo plano
    if (flat === 'true') {
      const cursosPlano = matriculas.map((m) => ({
        id_matricula: m.id_matricula,
        fecha_matricula: m.fecha_matricula,
        periodo: m.periodo,
        ...m.curso.toJSON(),
      }));
      return res.json({ ok: true, data: cursosPlano });
    }

    // agrupado por periodo (desde matricula.periodo)
    const agrupadoPorPeriodo = {};
    matriculas.forEach((m) => {
      const curso = m.curso;
      const periodoMatricula = m.periodo;

      if (!agrupadoPorPeriodo[periodoMatricula]) {
        agrupadoPorPeriodo[periodoMatricula] = {
          periodo: periodoMatricula,
          nombre: formatearNombrePeriodo(periodoMatricula),
          activo: esPeriodoActual(periodoMatricula),
          cursos: [],
        };
      }

      agrupadoPorPeriodo[periodoMatricula].cursos.push({
        id_curso: curso.id_curso,
        codigo: curso.codigo,
        nombre: curso.nombre_curso,
        seccion: curso.seccion.toString(),
        activo: curso.activo,
        profesor: curso.profesor?.nombre || 'Sin asignar'
      });
    });

    const periodosOrdenados = Object.values(agrupadoPorPeriodo).sort((a, b) =>
      b.periodo.localeCompare(a.periodo)
    );

    console.log('✅ Periodos agrupados:', periodosOrdenados.length);

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



// Helper para formatear el nombre del periodo
function formatearNombrePeriodo(periodo) {
  try {
    const [year, semester] = periodo.split('-');
    return `${year} - Semestre ${semester}`;
  } catch {
    return periodo;
  }
}

// Helper para determinar si el periodo es actual

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

    // 👇 primero traemos las matrículas "peladas"
    const mats = await Matricula.findAll({
      where,
      order: [['fecha_matricula', 'DESC']],
    });

    // si no hay, devolvemos vacío nomás
    if (!mats.length) {
      return res.json({ ok: true, data: [] });
    }

    // 👇 obtenemos ids únicos para no pegar mil consultas
    const idsUsuarios = [...new Set(mats.map(m => m.id_usuario))];
    const idsCursos = [...new Set(mats.map(m => m.id_curso))];

    // traemos usuarios y cursos por separado
    const usuarios = await Usuario.findAll({
      where: { id_usuario: idsUsuarios },
      attributes: ['id_usuario', 'nombre', 'correo_usuario', 'id_rol'],
    });

    const cursos = await Curso.findAll({
      where: { id_curso: idsCursos },
      attributes: ['id_curso', 'codigo', 'nombre_curso', 'seccion', 'periodo', 'activo'],
    });

    // los pasamos a mapas para armar rápido
    const mapaUsuarios = Object.fromEntries(
      usuarios.map(u => [u.id_usuario, u.toJSON()])
    );
    const mapaCursos = Object.fromEntries(
      cursos.map(c => [c.id_curso, c.toJSON()])
    );

    // armamos la respuesta final
    const data = mats.map(m => ({
      id_matricula: m.id_matricula,
      id_usuario: m.id_usuario,
      id_curso: m.id_curso,
      id_periodo: m.id_periodo,
      estado: m.estado,
      fecha_matricula: m.fecha_matricula,
      estudiante: mapaUsuarios[m.id_usuario] ?? null,
      curso: mapaCursos[m.id_curso] ?? null,
    }));

    return res.json({ ok: true, data });
  } catch (error) {
    console.error('[matriculas] listar error:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error interno al listar' });
  }
};

// Helper 
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