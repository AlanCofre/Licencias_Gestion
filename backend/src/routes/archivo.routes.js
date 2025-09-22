const { Router } = require('express');
const requireAuth = require('../middlewares/requireAuth');
const ctrl = require('../controllers/archivo.controller');
const pool = require('../db/db');

const router = Router();

// POST /api/archivos  → Registrar un archivo
router.post('/', requireAuth, ctrl.registrarArchivo);

// GET /api/archivos/licencia/:id  → Listar archivos de una licencia
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

module.exports = router;
