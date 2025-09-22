import { Router } from 'express';
import { LicenciaMedica, Usuario } from '../models/index.js';
import { validarJWT, esEstudiante, tieneRol } from '../../middlewares/auth.js';
import { crearLicencia, listarLicencias } from '../../controllers/licencias.controller.js';
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
router.get('/mis-licencias', validarJWT, listarLicencias);
router.post('/crear', [validarJWT, esEstudiante], crearLicencia);
router.get('/revisar', [validarJWT, tieneRol('profesor', 'secretario')], (req, res) => {
  res.json({ msg: 'Revisando licencias...' });
});
export default router;