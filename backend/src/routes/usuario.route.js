import { login, registrar, index, logout } from '../../controllers/controlador_Usuario.js';
import { serveView } from '../../middlewares/static_Serve.js';
import { Router } from 'express';

// :point_down: Importa CommonJS desde ESM sin tocar tu controlador existente
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const {
  requestPasswordReset,
  confirmPasswordReset
} = require('../../controllers/passwordResetController.js');

const router = Router();
// Vistas servidas como estÃ¡ticos
router.get('/login', serveView('login.html'));
router.get('/registro', serveView('registro.html'));
router.get('/index', serveView('index.html'));
// Acciones
router.post('/login', login);
router.post('/registro', registrar);
router.get('/index', index);
router.post('/logout', logout);

// === Password reset (mismo archivo de rutas, sin crear archivos nuevos) ===
router.post('/password-reset/request', requestPasswordReset);
router.post('/password-reset/confirm', confirmPasswordReset);

export default router;