const express = require('express');
const mysql = require('mysql2/promise');
const router = express.Router();

// Conexión a la base de datos
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'prueba'
});

// Ruta para insertar una notificación
router.post('/crear-notificacion', async (req, res) => {
  try {
    const { asunto, contenido, id_usuario } = req.body;

    if (!asunto || !contenido || !id_usuario) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    // Validar que el usuario exista
    const [usuario] = await pool.execute(
      'SELECT id_usuario FROM usuario WHERE id_usuario = ?',
      [id_usuario]
    );
    if (usuario.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Insertar notificación
    const sql = `
      INSERT INTO notificacion (
        asunto, contenido, leido, fecha_envio, id_usuario
      ) VALUES (?, ?, 0, NOW(), ?)
    `;
    const [resultado] = await pool.execute(sql, [
      asunto,
      contenido,
      id_usuario
    ]);

    res.status(201).json({
      mensaje: 'Notificación creada correctamente',
      id_notificacion: resultado.insertId
    });
  } catch (error) {
    console.error('❌ Error al crear notificación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
