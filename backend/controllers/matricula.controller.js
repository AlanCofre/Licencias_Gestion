// backend/controllers/matricula.controller.js
import { Matricula, Curso, Usuario, Rol } from '../src/models/index.js'; // Agregar Rol

export const obtenerMisMatriculas = async (req, res) => {
  try {
    const usuarioId = req.user?.id_usuario || req.user?.id;
    const { periodo, flat } = req.query;

    if (!usuarioId) {
      return res.status(401).json({ ok: false, error: 'No autenticado' });
    }

    // Obtener el usuario con su rol
    const usuario = await Usuario.findByPk(usuarioId, {
      include: [{
        model: Rol,
        attributes: ['id_rol', 'nombre_rol']
      }]
    });

    if (!usuario) {
      return res.status(404).json({ ok: false, error: 'Usuario no encontrado' });
    }

    // Verificar si es estudiante por id_rol (2 = estudiante)
    const idRol = usuario.id_rol;
    const nombreRol = usuario.Rol?.nombre_rol;

    console.log('🔍 Verificación de rol:', { idRol, nombreRol, usuarioId });

    // id_rol 2 = estudiante (según tu base de datos)
    if (idRol !== 2) {
      return res.status(403).json({ 
        ok: false, 
        error: 'Solo estudiantes pueden acceder a esta información',
        rol_actual: { id_rol: idRol, nombre_rol: nombreRol }
      });
    }

    // Resto del código del controlador (igual que antes)...
    const whereConditions = { id_usuario: usuarioId };
    
    if (periodo) {
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
              attributes: ['id_usuario', 'nombre']
            }
          ]
        }
      ],
      order: [
        ['curso', 'periodo', 'DESC'],
        ['curso', 'nombre_curso', 'ASC'],
        ['curso', 'seccion', 'ASC']
      ]
    });

    // Si no hay matrículas
    if (!matriculas.length) {
      return res.json({ 
        ok: true, 
        mensaje: 'No tienes cursos matriculados',
        data: flat ? [] : {}
      });
    }

    // Formato plano (flat)
    if (flat === 'true') {
      const cursosPlano = matriculas.map(m => ({
        id_matricula: m.id_matricula,
        fecha_matricula: m.fecha_matricula,
        ...m.curso.toJSON()
      }));

      return res.json({
        ok: true,
        data: cursosPlano
      });
    }

    // Formato agrupado por periodo (por defecto)
    const agrupadoPorPeriodo = {};
    
    matriculas.forEach(matricula => {
      const curso = matricula.curso;
      const periodo = curso.periodo;
      
      if (!agrupadoPorPeriodo[periodo]) {
        agrupadoPorPeriodo[periodo] = {
          periodo,
          es_periodo_actual: esPeriodoActual(periodo),
          cursos: []
        };
      }

      agrupadoPorPeriodo[periodo].cursos.push({
        id_curso: curso.id_curso,
        codigo: curso.codigo,
        nombre_curso: curso.nombre_curso,
        seccion: curso.seccion,
        activo: curso.activo,
        profesor: curso.profesor
      });
    });

    // Ordenar periodos descendente
    const periodosOrdenados = Object.values(agrupadoPorPeriodo)
      .sort((a, b) => b.periodo.localeCompare(a.periodo));

    return res.json({
      ok: true,
      data: periodosOrdenados
    });

  } catch (error) {
    console.error('❌ Error al obtener matrículas:', error);
    return res.status(500).json({ 
      ok: false, 
      error: 'Error interno al obtener matrículas' 
    });
  }
};

// Función auxiliar para determinar si un periodo es el actual
function esPeriodoActual(periodo) {
  try {
    const [year, semester] = periodo.split('-');
    const ahora = new Date();
    const añoActual = ahora.getFullYear();
    const semestreActual = ahora.getMonth() < 6 ? 1 : 2; // Ene-Jun: 1, Jul-Dic: 2
    
    return parseInt(year) === añoActual && parseInt(semester) === semestreActual;
  } catch {
    return false;
  }
}