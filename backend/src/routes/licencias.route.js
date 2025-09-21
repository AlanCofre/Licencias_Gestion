import { Router } from 'express';
import { validarJWT, esEstudiante, tieneRol } from '../../middlewares/auth.js';
import { crearLicencia, listarLicencias } from '../../controllers/licencias.controller.js';

const router = Router();

router.get('/mis-licencias', validarJWT, listarLicencias);
router.post('/crear', [validarJWT, esEstudiante], crearLicencia);
router.get('/revisar', [validarJWT, tieneRol('profesor', 'secretario')], (req, res) => {
  res.json({ msg: 'Revisando licencias...' });
});

export default router;
