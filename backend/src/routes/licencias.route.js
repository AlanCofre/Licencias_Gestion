import { Router } from 'express';
import { LicenciaMedica, Usuario } from '../models/index.js';

const router = Router();

router.get('/licencias', async (req, res) => {
  try {
    const limit = Number(req.query.limit || 20);
    const licencias = await LicenciaMedica.findAll({
      limit,
      include: [{ model: Usuario, attributes: ['id_usuario', 'correo_usuario', 'nombre'] }]
    });
    res.json(licencias);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
