// src/insert/insert.js
import express from 'express';
import pool from '../../config/db.js'; // Asegúrate de que la ruta sea correcta

const router = express.Router();

// Ruta POST para subir archivo
router.post('/subir-archivo', async (req, res) => {
  try {
    const { ruta_url, tipo_mime, hash, tamano, id_licencia } = req.body;

    // Validación de campos obligatorios
    if (!ruta_url || !tipo_mime || !hash || !tamano || !id_licencia) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    // Verificar que la licencia médica exista
    const [licencia] = await pool.execute(
      'SELECT id_licencia FROM licenciamedica WHERE id_licencia = ?',
      [id_licencia]
    );
    if (licencia.length === 0) {
      return res.status(404).json({ error: 'Licencia médica no encontrada' });
    }

    // Primera inserción
    const sql = `
      INSERT INTO archivolicencia (
        ruta_url, tipo_mime, hash, tamano, fecha_subida, id_licencia
      ) VALUES (?, ?, ?, ?, NOW(), ?)
    `;
    const [resultado1] = await pool.execute(sql, [
      ruta_url,
      tipo_mime,
      hash,
      tamano,
      id_licencia
    ]);

    // Segunda inserción (puedes modificar los valores si lo deseas)
    const rutaExtra = ruta_url + '_extra';
    const hashExtra = hash + '_extra';
    const [resultado2] = await pool.execute(sql, [
      rutaExtra,
      tipo_mime,
      hashExtra,
      tamano,
      id_licencia
    ]);

    res.status(201).json({
      mensaje: 'Se registraron dos archivos correctamente',
      id_archivo_1: resultado1.insertId,
      id_archivo_2: resultado2.insertId
    });
  } catch (error) {
    console.error('❌ Error al insertar archivo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
