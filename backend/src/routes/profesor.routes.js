// backend/src/routes/profesor.routes.js
import { Router } from 'express';
import { 
  obtenerLicenciasProfesor, 
  obtenerEntregaProfesorPorId 
} from '../../controllers/profesorController.js';
import requireAuth from '../../middlewares/requireAuth.js';
import { esProfesor } from '../../middlewares/roles.middleware.js';
import { validarJWT } from '../../middlewares/auth.js';
import { tieneRol } from '../../middlewares/auth.js';
import db from '../../config/db.js';
const router = Router();

// En la ruta GET /profesor/licencias
router.get('/licencias', validarJWT, tieneRol('profesor'), async (req, res) => {
  const { periodo } = req.query;
  const idProfesor = req.user?.id_usuario;

  try {
    if (!idProfesor) {
      return res.status(401).json({ ok: false, error: 'No autenticado' });
    }

    if (!periodo) {
      return res.status(400).json({
        ok: false,
        error: 'Debe indicar el código de período (?periodo=2025-1, por ejemplo)',
      });
    }

    // Obtener TODOS los cursos del profesor para el período (incluso sin licencias)
    const [cursos] = await db.execute(
      `
      SELECT 
        c.id_curso,
        c.codigo,
        c.nombre_curso,
        c.seccion,
        p.codigo AS periodo_codigo
      FROM curso c
      JOIN periodos_academicos p ON c.id_periodo = p.id_periodo
      WHERE c.id_usuario = ? 
        AND p.codigo = ?
      ORDER BY c.codigo, c.seccion
      `,
      [idProfesor, periodo]
    );

    if (cursos.length === 0) {
      return res.json({
        ok: true,
        data: [],
        mensaje: 'No tienes cursos asignados para este período'
      });
    }

    const idsCursos = cursos.map(curso => curso.id_curso);

    // Obtener licencias entregadas para los cursos del profesor
    const [licencias] = await db.execute(
      `
      SELECT 
        lm.id_licencia,
        lm.id_usuario              AS id_estudiante,
        lm.folio,
        lm.fecha_emision,
        lm.fecha_inicio,
        lm.fecha_fin,
        lm.estado,
        lm.motivo_rechazo,
        lm.fecha_creacion,
        lm.motivo_medico,

        u.nombre          AS nombre_estudiante,
        u.correo_usuario  AS correo_estudiante,

        c.id_curso,
        c.codigo          AS codigo_curso,
        c.nombre_curso,
        c.seccion,

        p.id_periodo,
        p.codigo          AS periodo_codigo,

        le.id_entrega,
        le.fecha_creacion AS fecha_entrega
      FROM licencias_entregas le
      JOIN licenciamedica lm ON le.id_licencia = lm.id_licencia
      JOIN curso c ON le.id_curso = c.id_curso
      JOIN periodos_academicos p ON c.id_periodo = p.id_periodo
      JOIN usuario u ON lm.id_usuario = u.id_usuario
      WHERE c.id_usuario = ?      -- profesor dueño del curso
        AND p.codigo = ?         -- período filtrado
        AND lm.estado IN ('aceptado', 'aprobado')  -- SOLO licencias aceptadas
      ORDER BY lm.fecha_creacion DESC
      `,
      [idProfesor, periodo]
    );

    // Formatear respuesta
    const licenciasFormateadas = licencias.map((r) => ({
      id_licencia: r.id_licencia,
      id_entrega: r.id_entrega,
      nombre_estudiante: r.nombre_estudiante || 'Sin nombre',
      correo_estudiante: r.correo_estudiante || 'Sin email',
      codigo_curso: r.codigo_curso,
      nombre_curso: r.nombre_curso,
      seccion: r.seccion,
      fecha_emision: r.fecha_emision,
      fecha_inicio: r.fecha_inicio,
      fecha_fin: r.fecha_fin,
      estado: r.estado,
      folio: r.folio,
      motivo_medico: r.motivo_medico,
      fecha_entrega: r.fecha_entrega,
      periodo_codigo: r.periodo_codigo
    }));

    return res.status(200).json({ 
      ok: true, 
      data: licenciasFormateadas,
      cursos: cursos, // Incluir información de todos los cursos para el combobox
      total: licenciasFormateadas.length
    });
  } catch (error) {
    console.error('❌ Error al obtener licencias del profesor:', error);
    return res.status(500).json({ 
      ok: false, 
      error: 'Error interno del servidor' 
    });
  }
});
/**
 * GET /profesor/licencias/:idEntrega
 * Detalle de una entrega específica
 */
router.get('/licencias/:idEntrega', requireAuth, esProfesor, obtenerEntregaProfesorPorId);

export default router;