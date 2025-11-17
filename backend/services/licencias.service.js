import db from '../config/db.js';

/**
 * Cuenta las licencias aceptadas por año para un usuario (estudiante).
 */
export async function countLicenciasAceptadasPorAnio(idUsuario, anio) {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS cantidad
       FROM licenciamedica
      WHERE id_usuario = ?
        AND estado = 'aceptado'
        AND YEAR(fecha_emision) = ?`,
    [idUsuario, anio]
  );
  return rows?.[0]?.cantidad ?? 0;
}
