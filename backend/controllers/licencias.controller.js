// backend/src/controllers/licencias.controller.js  (ESM unificado)
import db from '../config/db.js'; // ← ajusta la ruta si corresponde

// === Utilidad: generar folio tipo "F-YYYY-001==
async function generarFolio() {
  const year = new Date().getFullYear();
  const [rows] = await db.execute(
    'SELECT folio FROM LicenciaMedica WHERE folio LIKE ? ORDER BY id_licencia DESC LIMIT 1',
    [`F-${year}-%`]
  );
  let next = 1;
  if (rows.length) {
    const m = String(rows[0].folio).match(/F-\\d{4}-(\\d+)/);
    if (m) next = parseInt(m[1], 10) + 1;
  }
  return `F-${year}-${String(next).padStart(3, '0')}`;
}

// ===============================================
// GET: listar licencias del usuario autenticado
// (antes: licencias.controller.js con datos dummy)
// Ahora consulta real a la BD
// ===============================================
export const listarLicencias = async (req, res) => {
  try {
    const usuarioId = req.user?.id_usuario ?? req.id ?? null;
    const rol = req.user?.rol ?? req.rol ?? null;

    if (!usuarioId) {
      return res.status(401).json({ msg: 'No autenticado' });
    }

    const [rows] = await db.execute(
      `SELECT id_licencia, folio, fecha_emision, fecha_inicio, fecha_fin, estado, motivo_rechazo, fecha_creacion
         FROM LicenciaMedica
        WHERE id_usuario = ?
        ORDER BY fecha_emision DESC, id_licencia DESC`,
      [usuarioId]
    );

    return res.json({
      msg: 'Listado de licencias del usuario',
      usuarioId,
      rol,
      data: rows,
    });
  } catch (error) {
    console.error('[licencias:listarLicencias] error:', error);
    return res.status(500).json({ msg: 'Error al listar licencias' });
  }
};

// =====================================================
// POST (roles): crear licencia para el usuario autenticado
// Mantiene el contrato de respuesta del controller “roles”
// pero inserta realmente en la tabla LicenciaMedica.
// =====================================================
export const crearLicencia = async (req, res) => {
  try {
    const usuarioId = req.user?.id_usuario ?? req.id ?? null;
    const rol = (req.user?.rol ?? req.rol ?? '').toString().toLowerCase();

    if (!usuarioId) {
      return res.status(401).json({ msg: 'No autenticado' });
    }
    // Solo estudiantes (ajusta si tu proyecto permite más)
    if (rol && rol !== 'estudiante') {
      return res.status(403).json({ msg: 'Solo estudiantes pueden crear licencias' });
    }

    const { fecha_inicio, fecha_fin, motivo } = req.body || {};
    if (!fecha_inicio || !fecha_fin) {
      return res.status(400).json({ msg: 'Faltan datos obligatorios: fecha_inicio/fecha_fin' });
    }

    // (Opcional) validar formato simple YYYY-MM-DD
    const isISO = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d);
    if (!isISO(fecha_inicio) || !isISO(fecha_fin)) {
      return res.status(400).json({ msg: 'fecha_inicio/fecha_fin deben ser YYYY-MM-DD' });
    }
    if (new Date(fecha_inicio) > new Date(fecha_fin)) {
      return res.status(400).json({ msg: 'La fecha de inicio no puede ser posterior a la fecha fin' });
    }

    // (Opcional) verificar usuario existe
    const [u] = await db.execute('SELECT id_usuario FROM Usuario WHERE id_usuario = ?', [usuarioId]);
    if (!u.length) return res.status(404).json({ msg: 'Usuario no encontrado' });

    const folio = await generarFolio();

    // Insertar (motivo no existe en el esquema base; se ignora a nivel de tabla)
    const sql = `
      INSERT INTO LicenciaMedica
        (folio, fecha_emision, fecha_inicio, fecha_fin, estado, motivo_rechazo, fecha_creacion, id_usuario)
      VALUES
        (?,     CURDATE(),     ?,            ?,          'pendiente', NULL,            CURDATE(),     ?)
    `;
    const [result] = await db.execute(sql, [folio, fecha_inicio, fecha_fin, usuarioId]);

    const [row] = await db.execute(
      `SELECT id_licencia, folio, fecha_emision, fecha_inicio, fecha_fin, estado, motivo_rechazo, fecha_creacion, id_usuario
         FROM LicenciaMedica
        WHERE id_licencia = ?`,
      [result.insertId]
    );

    // Mantengo la forma de respuesta “roles”: msg + licencia
    return res.status(201).json({
      msg: 'Licencia creada con éxito',
      licencia: { ...row[0], motivo }, // devolvemos “motivo” en la respuesta si lo enviaron
    });
  } catch (error) {
    console.error('[licencias:crearLicencia] error:', error);
    return res.status(500).json({ msg: 'Error al crear la licencia' });
  }
};

// =====================================================
// POST (legacy): versión original con validaciones básicas
// (antes en licencia.controller.js con CommonJS)
// Mantiene el contrato: { ok, mensaje, data }
// =====================================================
export const crearLicenciaLegacy = async (req, res) => {
  try {
    const { id_usuario, rol } = req.user || {};
    if (!id_usuario) {
      return res.status(401).json({ ok: false, mensaje: 'No autenticado' });
    }
    const rolLower = (rol || '').toString().toLowerCase();
    if (!['estudiante', 'alumno'].includes(rolLower)) {
      return res.status(403).json({ ok: false, mensaje: 'Solo estudiantes pueden crear licencias' });
    }

    const { fecha_inicio, fecha_fin } = req.body || {};
    const isISO = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d);

    if (!isISO(fecha_inicio) || !isISO(fecha_fin)) {
      return res.status(400).json({ ok: false, mensaje: 'fecha_inicio/fecha_fin deben ser YYYY-MM-DD' });
    }
    if (new Date(fecha_inicio) > new Date(fecha_fin)) {
      return res.status(400).json({ ok: false, mensaje: 'fecha_inicio no puede ser posterior a fecha_fin' });
    }

    // verificar usuario
    const [u] = await db.execute('SELECT id_usuario FROM Usuario WHERE id_usuario = ?', [id_usuario]);
    if (!u.length) return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado' });

    const folio = await generarFolio();

    const sql = `
      INSERT INTO LicenciaMedica
        (folio, fecha_emision, fecha_inicio, fecha_fin, estado, motivo_rechazo, fecha_creacion, id_usuario)
      VALUES
        (?,     CURDATE(),     ?,            ?,          'pendiente', NULL,            CURDATE(),     ?)
    `;
    const [result] = await db.execute(sql, [folio, fecha_inicio, fecha_fin, id_usuario]);

    const [row] = await db.execute(
      'SELECT id_licencia, folio, fecha_emision, fecha_inicio, fecha_fin, estado, motivo_rechazo, fecha_creacion, id_usuario FROM LicenciaMedica WHERE id_licencia = ?',
      [result.insertId]
    );

    return res.status(201).json({ ok: true, mensaje: 'Licencia creada', data: row[0] });
  } catch (e) {
    console.error('❌ [licencias:crearLicenciaLegacy] error:', e);
    return res.status(500).json({ ok: false, mensaje: 'Error creando licencia', detalle: e.message });
  }
};

// Export default opcional (por si alguien importa default)
export default { listarLicencias, crearLicencia, crearLicenciaLegacy };
