import db from '../config/db.js';
import { countLicenciasAceptadasPorAnio } from '../services/licencias.service.js';

/**
 * GET /funcionario/estudiantes/:id/alerta-licencias?anio=YYYY
 * Respuesta: { ok, data:{ anio, cantidad, excede_limite, limite } }
 */
export async function getAlertaLicenciasAnuales(req, res) {
  try {
    const idUsuario = Number(req.params.id);
    const anio = Number(req.query.anio) || new Date().getFullYear();

    if (!idUsuario) {
      return res.status(400).json({ ok: false, mensaje: 'ID de usuario inválido' });
    }

    const cantidad = await countLicenciasAceptadasPorAnio(idUsuario, anio);
    const limite = 5;
    const excede = cantidad > limite;

    return res.json({
      ok: true,
      data: { anio, cantidad, excede_limite: excede, limite },
    });
  } catch (error) {
    console.error('getAlertaLicenciasAnuales:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error interno' });
  }
}

/**
 * GET /funcionario/alertas/exceso-licencias?anio=YYYY
 * Respuesta: { ok, data:[{ id_usuario, nombre, correo, cantidad, anio }] }
 */
export async function listarAlertasExcesoLicencias(req, res) {
  try {
    const anio = Number(req.query.anio) || new Date().getFullYear();

    const [rows] = await db.query(
      `SELECT u.id_usuario,
              u.nombre,
              u.correo_usuario,
              COUNT(l.id_licencia) AS cantidad
         FROM licenciamedica l
         JOIN usuario u ON u.id_usuario = l.id_usuario
        WHERE l.estado = 'aceptado'
          AND YEAR(l.fecha_emision) = ?
        GROUP BY u.id_usuario, u.nombre, u.correo_usuario
        HAVING cantidad > 5
        ORDER BY cantidad DESC`,
      [anio]
    );

    const data = rows.map(r => ({
      id_usuario: r.id_usuario,
      nombre: r.nombre,
      correo: r.correo_usuario,
      cantidad: Number(r.cantidad),
      anio,
    }));

    return res.json({ ok: true, data });
  } catch (error) {
    console.error('listarAlertasExcesoLicencias:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error al obtener alertas' });
  }
}
