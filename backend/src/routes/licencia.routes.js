const { Router } = require('express');
const requireAuth = require('../middlewares/requireAuth');
const validarLicencia = require('../middlewares/validarLicencia');
const ctrl = require('../controllers/licencia.controller');

const router = Router();
router.post('/', requireAuth, validarLicencia, ctrl.crearLicencia);

module.exports = router;
