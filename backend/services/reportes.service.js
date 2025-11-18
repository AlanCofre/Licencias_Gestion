// backend/services/reportes.service.js
import db from '../config/db.js';

/**
 * Servicio: excesoLicenciasSvc
 * Retorna los estudiantes que superan N licencias aceptadas dentro de un mismo año.
 * Filtra por curso/sección si se especifica, y restringe por profesor si el token pertenece a uno.
 */
export async function excesoLicenciasSvc({ filtro, idProfesor }) {
  const { year, limite, curso, seccion } = filtro;

  // Construcción dinámica del WHERE con mysql2
  const where = [];
  const params = [];

  // Año (obligatorio)
  where.push(`YEAR(l.fecha_inicio) = ?`);
  params.push(year);

  // Solo licencias aceptadas
  where.push(`l.estado = 'aceptado'`);

  // Filtro por curso (opcional)
  if (curso) {
    where.push(`c.id_curso = ?`);
    params.push(curso);
  }

  // Filtro por sección (opcional)
  if (seccion) {
    where.push(`c.seccion = ?`);
    params.push(seccion);
  }

  // Si es profesor, limitar a sus cursos
  if (idProfesor) {
    where.push(`c.id_usuario = ?`);
    params.push(idProfesor);
  }

  const sql = `
    SELECT
      u.id_usuario              AS id_estudiante,
      u.nombre                  AS nombre_estudiante,
      u.correo_usuario          AS correo_estudiante,
      c.id_curso,
      c.nombre_curso,
      c.seccion,
      YEAR(l.fecha_inicio)      AS anio,
      COUNT(*)                  AS total_licencias
    FROM licenciamedica l
    JOIN usuario u     ON u.id_usuario = l.id_usuario
    JOIN matriculas m  ON m.id_usuario = u.id_usuario
    JOIN curso c       ON c.id_curso   = m.id_curso
    WHERE ${where.join(' AND ')}
    GROUP BY u.id_usuario, c.id_curso, c.seccion, YEAR(l.fecha_inicio)
    HAVING COUNT(*) > ?
    ORDER BY total_licencias DESC, nombre_estudiante ASC
  `;

  params.push(limite);

  const [rows] = await db.execute(sql, params);
  return rows;
}

export async function repeticionPatologiasSvc() {
  const sql = `
    SELECT
      u.id_usuario              AS id_estudiante,
      u.nombre                  AS nombre_estudiante,
      u.correo_usuario          AS correo_estudiante,
      l.motivo_medico,
      COUNT(*)                  AS repeticiones,
      GROUP_CONCAT(DATE(l.fecha_inicio) ORDER BY l.fecha_inicio) AS fechas
    FROM licenciamedica l
    JOIN usuario u ON u.id_usuario = l.id_usuario
    WHERE l.estado = 'pendiente' AND l.motivo_medico IS NOT NULL
    GROUP BY u.id_usuario, l.motivo_medico
    HAVING repeticiones >= 3
    ORDER BY repeticiones DESC, nombre_estudiante ASC
  `;

  const [rows] = await db.execute(sql);
  return rows;
}

