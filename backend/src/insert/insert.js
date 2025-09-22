// src/insert/insert.js
const express = require('express');
const mysql = require('mysql2/promise');

const router = express.Router();

// Conexión a la base de datos (ajusta credenciales según .env si quieres)
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'prueba'
});

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

    // Insertar archivo en la base de datos
    const sql = `
      INSERT INTO archivolicencia (
        ruta_url, tipo_mime, hash, tamano, fecha_subida, id_licencia
      ) VALUES (?, ?, ?, ?, NOW(), ?)
    `;
    const [resultado] = await pool.execute(sql, [
      ruta_url,
      tipo_mime,
      hash,
      tamano,
      id_licencia
    ]);

    res.status(201).json({
      mensaje: 'Archivo registrado correctamente',
      id_archivo: resultado.insertId
    });
  } catch (error) {
    console.error('❌ Error al insertar archivo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
