// backend/src/notification/notificacion.js  (ESM)
import { Router } from 'express';
import db from '../../config/db.js'; // ← ajusta la ruta si corresponde

const router = Router();

router.post('/crear-notificacion', async (req, res) => {
  try {
    const { asunto, contenido, id_usuario } = req.body;

    if (!asunto || !contenido || !id_usuario) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    // Verificar que el usuario exista
    const [usuario] = await db.execute(
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
    const [resultado] = await db.execute(sql, [asunto, contenido, id_usuario]);

    return res.status(201).json({
      mensaje: 'Notificación creada correctamente',
      id_notificacion: resultado.insertId
    });
  } catch (error) {
    console.error('❌ Error al crear notificación:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
