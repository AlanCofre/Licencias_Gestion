// backend/controllers/profesorController.js
import db from '../config/db.js';

/**
 * Resuelve el código de período a usar:
 * - ?periodo=2025-1 en la query, o
 * - período activo (periodos_academicos.activo = 1)
 */
async function resolverPeriodoCodigo(req) {
  const q = (req.query?.periodo || req.query?.codigo || '').trim();
  if (q) return q;

  const [rows] = await db.execute(
    'SELECT codigo FROM periodos_academicos WHERE activo = 1 ORDER BY id_periodo DESC LIMIT 1'
  );

  return rows[0]?.codigo || null;
}

/* ============================================================
 * GET /profesor/licencias
 * Listar licencias de alumnos que tienen cursos conmigo
 * en el período indicado
 * ============================================================ */
export async function listarLicenciasProfesor(req, res) {
  try {
    const profesorId =
      req.user?.id_usuario ??
      req.id ??
      null;

    if (!profesorId) {
      return res.status(401).json({ ok: false, mensaje: 'No autenticado' });
    }

    const periodoCodigo = await resolverPeriodoCodigo(req);
    if (!periodoCodigo) {
      return res.status(400).json({
        ok: false,
        mensaje: 'No se pudo determinar el período académico (faltan datos en periodos_academicos)',
      });
    }

    // 🔹 Consulta REAL según tu esquema:
    //  licenciamedica  (l)   -> fechas, estado, id_usuario (alumno)
    //  usuario         (u)   -> nombre, correo alumno
    //  matriculas      (m)   -> une alumno-curso-período
    //  curso           (c)   -> nombre_curso, seccion, id_usuario (profesor)
    //  periodos_academicos (p) -> codigo período
    const [rows] = await db.execute(
      `
      SELECT
        l.id_licencia                      AS id_licencia,
        u.nombre                           AS nombre_estudiante,
        u.id_usuario                       AS id_estudiante,
        u.correo_usuario                   AS correo_estudiante,
        c.nombre_curso                     AS nombre_curso,
        c.codigo                           AS codigo_curso,
        c.seccion                          AS seccion,
        DATE(l.fecha_emision)              AS fecha_emision,
        DATE(l.fecha_inicio)               AS fecha_inicio,
        DATE(l.fecha_fin)                  AS fecha_fin,
        l.estado                           AS estado,
        p.codigo                           AS periodo_codigo
      FROM licenciamedica l
      JOIN usuario u              ON u.id_usuario   = l.id_usuario
      JOIN matriculas m           ON m.id_usuario   = l.id_usuario
      JOIN curso c                ON c.id_curso     = m.id_curso
      JOIN periodos_academicos p  ON p.id_periodo   = c.id_periodo
      WHERE c.id_usuario = ?
        AND p.codigo    = ?
      GROUP BY l.id_licencia
      ORDER BY l.fecha_inicio DESC, l.id_licencia DESC
      `,
      [profesorId, periodoCodigo]
    );

    // Adaptamos el shape para que tu ProfeLicencias.jsx lo pueda normalizar sin tocar mucho
    const data = rows.map((r) => ({
      id_licencia: r.id_licencia,
      // nombres que tu FE ya conoce:
      nombre_estudiante: r.nombre_estudiante,
      id_estudiante: r.id_estudiante,
      correo_estudiante: r.correo_estudiante,
      nombre_curso: r.nombre_curso,
      codigo_curso: r.codigo_curso,
      seccion: r.seccion,
      fecha_emision: r.fecha_emision,
      fecha_inicio: r.fecha_inicio,
      fecha_fin: r.fecha_fin,
      estado: r.estado,
      periodo_codigo: r.periodo_codigo,
    }));

    return res.json({ ok: true, data });
  } catch (err) {
    console.error('[listarLicenciasProfesor] error:', err);
    return res.status(500).json({ ok: false, mensaje: 'Error interno' });
  }
}

/* ============================================================
 * GET /profesor/licencias/:idEntrega
 * Detalle de una licencia específica, validando que el prof
 * tenga al menos un curso con ese alumno.
 * ============================================================ */
export async function obtenerEntregaProfesorPorId(req, res) {
  try {
    const profesorId =
      req.user?.id_usuario ??
      req.id ??
      null;

    if (!profesorId) {
      return res.status(401).json({ ok: false, mensaje: 'No autenticado' });
    }

    const { idEntrega } = req.params;

    const [rows] = await db.execute(
      `
      SELECT
        l.id_licencia                      AS id_licencia,
        l.folio                            AS folio,
        DATE(l.fecha_emision)              AS fecha_emision,
        DATE(l.fecha_inicio)               AS fecha_inicio,
        DATE(l.fecha_fin)                  AS fecha_fin,
        l.estado                           AS estado,
        l.motivo_rechazo                   AS motivo_rechazo,
        l.fecha_creacion                   AS fecha_creacion,
        u.id_usuario                       AS id_estudiante,
        u.nombre                           AS nombre_estudiante,
        u.correo_usuario                   AS correo_estudiante,
        c.id_curso                         AS id_curso,
        c.nombre_curso                     AS nombre_curso,
        c.codigo                           AS codigo_curso,
        c.seccion                          AS seccion,
        p.codigo                           AS periodo_codigo
      FROM licenciamedica l
      JOIN usuario u              ON u.id_usuario   = l.id_usuario
      JOIN matriculas m           ON m.id_usuario   = l.id_usuario
      JOIN curso c                ON c.id_curso     = m.id_curso
      JOIN periodos_academicos p  ON p.id_periodo   = c.id_periodo
      WHERE l.id_licencia = ?
        AND c.id_usuario  = ?   -- seguridad: sólo cursos de este profe
      LIMIT 1
      `,
      [idEntrega, profesorId]
    );

    if (!rows.length) {
      return res.status(404).json({ ok: false, mensaje: 'Entrega no encontrada' });
    }

    const r = rows[0];

    // Armamos payload amigable para EntregaDetalle.jsx
    const data = {
      id: r.id_licencia,
      folio: r.folio,
      curso: `${r.codigo_curso || ''} ${r.nombre_curso || ''}`.trim(),
      periodo: r.periodo_codigo,
      profesorOwnerId: profesorId,
      estudiante: {
        id: r.id_estudiante,
        nombre: r.nombre_estudiante,
        email: r.correo_estudiante,
      },
      fechas: {
        emision: r.fecha_emision,
        inicioReposo: r.fecha_inicio,
        finReposo: r.fecha_fin,
        envio: r.fecha_creacion, // mejor que nada; si después tienes otra columna la cambiamos
      },
      observacionesSecretaria: r.motivo_rechazo || null,
      estado: r.estado,
      // por ahora sin archivo real; cuando tengamos archivo/licencia lo conectamos
      file: null,
    };

    return res.json({ ok: true, data });
  } catch (err) {
    console.error('[obtenerEntregaProfesorPorId] error:', err);
    return res.status(500).json({ ok: false, mensaje: 'Error interno' });
  }
}
