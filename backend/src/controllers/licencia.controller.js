// src/controllers/licencia.controller.js
const pool = require('../db/db');

// Folio tipo "F-YYYY-001"
async function generarFolio() {
  const year = new Date().getFullYear();
  const [rows] = await pool.execute(
    'SELECT folio FROM LicenciaMedica WHERE folio LIKE ? ORDER BY id_licencia DESC LIMIT 1',
    [`F-${year}-%`]
  );
  let next = 1;
  if (rows.length) {
    const m = String(rows[0].folio).match(/F-\d{4}-(\d+)/);
    if (m) next = parseInt(m[1], 10) + 1;
  }
  return `F-${year}-${String(next).padStart(3, '0')}`;
}

exports.crearLicencia = async (req, res) => {
  try {
    const { id_usuario, rol } = req.user || {};
    if (!id_usuario) return res.status(401).json({ ok: false, mensaje: 'No autenticado' });
    if (!['Estudiante', 'Alumno', 'ESTUDIANTE', 'estudiante'].includes(rol)) {
      return res.status(403).json({ ok: false, mensaje: 'Solo estudiantes pueden crear licencias' });
    }

    const { fecha_inicio, fecha_fin } = req.body || {};

    const isISO = d => /^\d{4}-\d{2}-\d{2}$/.test(d);
    if (!isISO(fecha_inicio) || !isISO(fecha_fin)) {
      return res.status(400).json({ ok: false, mensaje: 'fecha_inicio/fecha_fin deben ser YYYY-MM-DD' });
    }
    if (new Date(fecha_inicio) > new Date(fecha_fin)) {
      return res.status(400).json({ ok: false, mensaje: 'fecha_inicio no puede ser posterior a fecha_fin' });
    }

    // (Opcional) verificar usuario existe
    const [u] = await pool.execute('SELECT id_usuario FROM Usuario WHERE id_usuario = ?', [id_usuario]);
    if (!u.length) return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado' });

    const folio = await generarFolio();

    // Insertar en LicenciaMedica (estado enum: 'pendiente')
    const sql = `
      INSERT INTO LicenciaMedica
        (folio, fecha_emision, fecha_inicio, fecha_fin, estado, motivo_rechazo, fecha_creacion, id_usuario)
      VALUES
        (?,     CURDATE(),     ?,            ?,          'pendiente', NULL,            CURDATE(),     ?)
    `;
    const [result] = await pool.execute(sql, [folio, fecha_inicio, fecha_fin, id_usuario]);

    const [row] = await pool.execute(
      'SELECT id_licencia, folio, fecha_emision, fecha_inicio, fecha_fin, estado, motivo_rechazo, fecha_creacion, id_usuario FROM LicenciaMedica WHERE id_licencia = ?',
      [result.insertId]
    );

    return res.status(201).json({ ok: true, mensaje: 'Licencia creada', data: row[0] });
  } catch (e) {
    console.error('❌ Error creando licencia:', e);
    return res.status(500).json({ ok: false, mensaje: 'Error creando licencia', detalle: e.message });
  }
};
