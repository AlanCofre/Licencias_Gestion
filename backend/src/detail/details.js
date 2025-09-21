import express from 'express';

const router = express.Router();
const db = require('../db/db'); 

// GET /licencias/usuario/:id
router.get('/licencias/usuario/:id', async (req, res) => {
  const idUsuario = req.params.id;

  try {
    const [licencias] = await db.execute(
      `SELECT * FROM licenciamedica WHERE id_usuario = ? ORDER BY fecha_emision DESC`,
      [idUsuario]
    );

    res.status(200).json({ licencias });
  } catch (err) {
    console.error('❌ Error al consultar licencias por usuario:', err);
    res.status(500).json({ error: 'Error al obtener licencias' });
  }
});

export default router;
