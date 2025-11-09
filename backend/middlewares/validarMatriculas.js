// backend/middlewares/validarMatriculas.js
import db from '../config/db.js';

/**
 * Middleware para validar que el estudiante esté matriculado en los cursos seleccionados
 */
export const validarMatriculasActivas = async (req, res, next) => {
  try {
    const usuarioId = req.user?.id_usuario;
    
    if (!usuarioId) {
      return res.status(401).json({ ok: false, error: 'No autenticado' });
    }

    // Obtener cursos del body
    let cursos = [];
    const cursosRaw = req.body?.cursos ?? null;
    if (cursosRaw) {
      try {
        cursos = typeof cursosRaw === 'string' ? JSON.parse(cursosRaw) : cursosRaw;
      } catch (e) {
        cursos = [];
      }
    }

    // Validación básica de cursos
    if (!Array.isArray(cursos) || cursos.length === 0) {
      return res.status(400).json({
        ok: false,
        error: 'Debe seleccionar al menos un curso afectado'
      });
    }

    // Verificar matrículas activas
    const idsCursos = [...new Set(cursos.map(id => parseInt(id)))];
    
    const [matriculas] = await db.execute(
      `SELECT c.id_curso, c.codigo, c.nombre_curso
       FROM matriculas m
       JOIN curso c ON m.id_curso = c.id_curso
       WHERE m.id_usuario = ? 
         AND c.id_curso IN (${idsCursos.map(() => '?').join(',')})
         AND c.activo = 1`,
      [usuarioId, ...idsCursos]
    );

    // Verificar que todos los cursos seleccionados tengan matrícula activa
    const cursosConMatricula = matriculas.map(m => m.id_curso);
    const cursosSinMatricula = idsCursos.filter(id => !cursosConMatricula.includes(id));

    if (cursosSinMatricula.length > 0) {
      // Obtener nombres de cursos sin matrícula para el mensaje de error
      const [cursosNoMatriculados] = await db.execute(
        `SELECT id_curso, codigo, nombre_curso 
         FROM curso 
         WHERE id_curso IN (${cursosSinMatricula.map(() => '?').join(',')})`,
        cursosSinMatricula
      );

      const nombresCursos = cursosNoMatriculados.map(c => `${c.codigo} - ${c.nombre_curso}`).join(', ');
      return res.status(400).json({
        ok: false,
        error: `No estás matriculado en los siguientes cursos: ${nombresCursos}`
      });
    }

    // Si todo está bien, continuar
    next();
  } catch (error) {
    console.error('❌ Error en validarMatriculasActivas:', error);
    return res.status(500).json({
      ok: false,
      error: 'Error al validar matrículas'
    });
  }
};