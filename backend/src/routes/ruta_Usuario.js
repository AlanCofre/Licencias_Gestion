import { Router } from 'express';
import { registrar, login } from '../../controllers/controlador_Usuario.js';

const router = Router();

router.post('/registro', registrar);
router.post('/login', login);

export default router;
// const express = require('express');
// const router = express.Router();
// const { registrar, login } = require('../controllers/controlador_Usuario');