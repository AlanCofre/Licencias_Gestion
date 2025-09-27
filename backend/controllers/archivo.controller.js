
import pool from '../db/db.js';

async function registrarArchivo(req, res) {
  try {
    const { ruta_url, tipo_mime, hash, tamano, id_licencia } = req.body || {};

    // Validaciones mínimas
    if (!ruta_url || typeof ruta_url !== 'string' || ruta_url.length > 4096) {
      return res.status(400).json({ ok: false, mensaje: 'ruta_url es requerida (<=4096)' });
    }
    if (!tipo_mime || typeof tipo_mime !== 'string' || tipo_mime.length > 100) {
      return res.status(400).json({ ok: false, mensaje: 'tipo_mime es requerido (<=100)' });
    }
    if (!hash || typeof hash !== 'string' || hash.length > 128) {
      return res.status(400).json({ ok: false, mensaje: 'hash es requerido (<=128)' });
    }
    if (!Number.isInteger(Number(tamano)) || Number(tamano) <= 0) {
      return res.status(400).json({ ok: false, mensaje: 'tamano debe ser entero positivo' });
    }
    if (!Number.isInteger(Number(id_licencia))) {
      return res.status(400).json({ ok: false, mensaje: 'id_licencia inválido' });
    }

    // Verificar que la licencia existe
    const [lic] = await pool.execute(
      'SELECT id_licencia FROM LicenciaMedica WHERE id_licencia = ?',
      [id_licencia]
    );
    if (!lic.length) {
      return res.status(404).json({ ok: false, mensaje: 'Licencia no encontrada' });
    }

    // Insertar en ArchivoLicencia
    const sql = `
      INSERT INTO ArchivoLicencia
        (ruta_url, tipo_mime, hash, tamano, fecha_subida, id_licencia)
      VALUES
        (?, ?, ?, ?, NOW(), ?)
    `;
    const [r] = await pool.execute(sql, [
      ruta_url,
      tipo_mime,
      hash,
      Number(tamano),
      Number(id_licencia)
    ]);

    return res.status(201).json({
      ok: true,
      mensaje: 'Archivo registrado',
      data: { id_archivo: r.insertId }
    });
  } catch (e) {
    console.error('Error registrando archivo:', e);
    return res.status(500).json({
      ok: false,
      mensaje: 'Error registrando archivo',
      detalle: e.message
    });
  }
}

// Exportación como objeto default
export default {
  registrarArchivo
};
