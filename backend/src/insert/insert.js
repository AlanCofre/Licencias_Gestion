// src/insert/insert.js
import express from 'express';
import pool from '../../config/db.js';

const router = express.Router();

/** --- Validadores auxiliares --- */
function isSha256Hex(s) {
  return typeof s === 'string' && /^[0-9a-f]{64}$/i.test(s);
}
function isPositiveInt(n) {
  const v = Number(n);
  return Number.isInteger(v) && v > 0;
}

/**
 * POST /archivos/subir-archivo
 * Body JSON:
 * {
 *   ruta_url: string (<=4096),
 *   tipo_mime: "application/pdf",
 *   hash: "<sha256 hex 64>",
 *   tamano: int (bytes, <= 10MB),
 *   id_licencia: int (debe existir en licenciamedica),
 *   nombre_archivo?: string
 * }
 *
 * Regla: una licencia (y por ende su folio) solo puede tener UN archivo.
 */
router.post('/subir-archivo', async (req, res) => {
  try {
    const {
      ruta_url,
      tipo_mime,
      hash,
      tamano,
      id_licencia,
      nombre_archivo // opcional; se puede persistir si existe la columna
    } = req.body || {};

    // --- Validaciones básicas ---
    if (!ruta_url || typeof ruta_url !== 'string' || ruta_url.trim().length === 0 || ruta_url.length > 4096) {
      return res.status(400).json({ ok: false, error: 'ruta_url es requerida (<=4096)' });
    }

    const mime = String(tipo_mime || '').toLowerCase().trim();
    if (!mime.startsWith('application/pdf')) {
      return res.status(400).json({ ok: false, error: 'tipo_mime inválido: debe ser application/pdf' });
    }

    if (!isSha256Hex(hash)) {
      return res.status(400).json({ ok: false, error: 'hash inválido: debe ser SHA-256 hex (64 caracteres)' });
    }

    if (!isPositiveInt(tamano) || Number(tamano) > 10 * 1024 * 1024) { // 10MB máx
      return res.status(400).json({ ok: false, error: 'tamano debe ser entero positivo (<=10MB)' });
    }

    if (!isPositiveInt(id_licencia)) {
      return res.status(400).json({ ok: false, error: 'id_licencia inválido' });
    }

    // --- Verificar que la licencia médica exista y obtener su folio (para mensaje) ---
    const [licRows] = await pool.execute(
      'SELECT id_licencia, folio FROM licenciamedica WHERE id_licencia = ?',
      [Number(id_licencia)]
    );
    if (!licRows.length) {
      return res.status(404).json({ ok: false, error: 'Licencia médica no encontrada' });
    }
    const folioLic = licRows[0].folio;

    // --- Regla de negocio: una licencia (folio) solo puede tener UN archivo ---
    const [dupLic] = await pool.execute(
      'SELECT id_archivo FROM archivolicencia WHERE id_licencia = ? LIMIT 1',
      [Number(id_licencia)]
    );
    if (dupLic.length > 0) {
      return res.status(409).json({
        ok: false,
        mensaje: `Esta licencia (folio ${folioLic}) ya tiene un archivo registrado. No se permiten duplicados.`,
        campo: 'id_licencia'
      });
    }

    // --- Verificar si ya existe un archivo con el mismo hash (contenido duplicado global) ---
    const [dupHash] = await pool.execute(
      'SELECT id_archivo, id_licencia FROM archivolicencia WHERE hash = ? LIMIT 1',
      [hash.toLowerCase()]
    );
    if (dupHash.length > 0) {
      return res.status(400).json({
        ok: false,
        error: 'Ya existe un archivo con el mismo contenido (hash duplicado)',
        duplicado: dupHash[0]
      });
    }

    // --- Insertar el nuevo archivo ---
    // (Mantengo las columnas originales para evitar errores si la tabla no tiene nombre_archivo)
    const sql = `
      INSERT INTO archivolicencia
        (ruta_url, tipo_mime, hash, tamano, fecha_subida, id_licencia)
      VALUES (?, ?, ?, ?, NOW(), ?)
    `;
    const [r] = await pool.execute(sql, [
      ruta_url.trim(),
      mime,
      hash.toLowerCase(),
      Number(tamano),
      Number(id_licencia)
    ]);

    return res.status(201).json({
      ok: true,
      mensaje: 'Archivo registrado correctamente',
      data: { id_archivo: r.insertId }
    });
  } catch (error) {
    // Si agregas un índice único a nivel BD (UNIQUE(id_licencia)), caerá aquí si se intenta duplicar
    if (String(error?.code) === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        ok: false,
        mensaje: 'Esta licencia ya tiene un archivo registrado. No se permiten duplicados.',
        campo: 'id_licencia'
      });
    }

    console.error('❌ Error al insertar archivo:', error);
    return res.status(500).json({ ok: false, error: 'Error interno del servidor' });
  }
});

export default router;
