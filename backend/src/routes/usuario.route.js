// backend/src/routes/usuario.route.js
import { Router } from 'express';
import { registrar, index, logout } from '../../controllers/controlador_Usuario.js';
import { login as loginNuevo } from '../../controllers/auth.controller.js';
import { serveView } from '../../middlewares/static_Serve.js';
import {
  requestPasswordReset,
  confirmPasswordReset
} from '../../controllers/passwordResetController.js';

const router = Router();

// Vistas servidas como estáticos
router.get('/login', serveView('login.html'));
router.get('/registro', serveView('registro.html'));
router.get('/index', serveView('index.html'));

// Acciones
router.post('/login', loginNuevo);
router.post('/registro', registrar);
router.get('/index', index);
router.post('/logout', logout);

// === Password reset ===
router.post('/password-reset/request', requestPasswordReset);
router.post('/password-reset/confirm', confirmPasswordReset);

// === Obtener notificaciones ===
router.get('/notificaciones/password', requireAuth, NotificacionesPassword);
router.get('/notificaciones/perfil', requireAuth, NotificacionesPerfil);


export default router;
