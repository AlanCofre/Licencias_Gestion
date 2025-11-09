// backend/controllers/estudiante.controller.js
import db from '../config/db.js';

/**
 * Obtener cursos matriculados del estudiante autenticado
 * GET /api/estudiantes/mis-cursos?periodo=opcional
 */
export const obtenerMisCursos = async (req, res) => {
  try {
    const usuarioId = req.user?.id_usuario;
    const { periodo } = req.query;

    if (!usuarioId) {
      return res.status(401).json({ 
        ok: false, 
        error: 'No autenticado' 
      });
    }

    // Determinar el período activo si no se especifica
    let periodoActivo = periodo;
    if (!periodoActivo) {
      const [periodos] = await db.execute(
        'SELECT periodo FROM curso WHERE activo = 1 ORDER BY id_curso DESC LIMIT 1'
      );
      
      if (periodos.length === 0) {
        return res.status(409).json({ 
          ok: false, 
          error: 'No existe un período activo en el sistema' 
        });
      }
      periodoActivo = periodos[0].periodo;
    }

    // Obtener cursos matriculados del estudiante
    const [cursos] = await db.execute(
      `SELECT 
        c.id_curso,
        c.codigo,
        c.nombre_curso as nombre,
        c.seccion,
        c.periodo,
        c.activo,
        u.nombre as profesor_nombre
      FROM matriculas m
      JOIN curso c ON m.id_curso = c.id_curso
      JOIN usuario u ON c.id_usuario = u.id_usuario
      WHERE m.id_usuario = ? 
        AND c.periodo = ?
        AND c.activo = 1
      ORDER BY c.nombre_curso ASC, c.seccion ASC`,
      [usuarioId, periodoActivo]
    );

    // Formatear respuesta con campos mínimos requeridos
    const cursosFormateados = cursos.map(curso => ({
      id_curso: curso.id_curso,
      codigo: curso.codigo,
      nombre: curso.nombre,
      seccion: curso.seccion,
      periodo: curso.periodo
    }));

    return res.status(200).json({
      ok: true,
      data: cursosFormateados,
      meta: {
        periodo: periodoActivo,
        total: cursosFormateados.length
      }
    });

  } catch (error) {
    console.error('❌ Error en obtenerMisCursos:', error);
    return res.status(500).json({ 
      ok: false, 
      error: 'Error interno del servidor' 
    });
  }
};