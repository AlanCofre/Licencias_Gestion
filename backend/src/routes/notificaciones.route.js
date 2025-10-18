import { Router } from 'express';
import db from '../../config/db.js'; // Ajusta la ruta si es necesario
import { validarJWT} from '../../middlewares/auth.js';

const router = Router();

// 1. Obtener notificaciones del usuario autenticado
router.get('/', validarJWT, async (req, res) => {
  try {
    const id_usuario = req.user.id_usuario;
    const [notificaciones] = await db.execute(
      `SELECT id_notificacion, asunto, contenido, leido, fecha_envio
         FROM notificacion
        WHERE id_usuario = ?
        ORDER BY fecha_envio DESC`,
      [id_usuario]
    );
    res.json({ ok: true, data: notificaciones });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'Error al obtener notificaciones' });
  }
});

// 2. Marcar una notificación como leída
router.put('/:id/leida', validarJWT, async (req, res) => {
  try {
    const id_usuario = req.user.id_usuario;
    const id = req.params.id;
    const [result] = await db.execute(
      `UPDATE notificacion SET leido = 1 WHERE id_notificacion = ? AND id_usuario = ?`,
      [id, id_usuario]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, error: 'Notificación no encontrada' });
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'Error al marcar como leída' });
  }
});

export default router;