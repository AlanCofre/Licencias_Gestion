// backend/src/routes/archivo.routes.js
import { Router } from 'express';
import requireAuth from '../../middlewares/requireAuth.js';
import ctrl from '../../controllers/archivo.controller.js';
import pool from '../../db/db.js';

const router = Router();

// POST /api/archivos → Registrar un archivo
router.post('/', requireAuth, ctrl.registrarArchivo);

// GET /api/archivos/licencia/:id → Listar archivos de una licencia
router.get('/licencia/:id', requireAuth, async (req, res) => {
  try {
    const idLicencia = req.params.id;
    const [rows] = await pool.execute(
      'SELECT * FROM ArchivoLicencia WHERE id_licencia = ?',
      [idLicencia]
    );
    return res.json({ ok: true, data: rows });
  } catch (e) {
    console.error('❌ Error obteniendo archivos:', e);
    return res.status(500).json({ ok: false, mensaje: 'Error obteniendo archivos', detalle: e.message });
  }
});

export default router;
