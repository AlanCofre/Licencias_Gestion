import { Router } from 'express';
import { login, registro, home, logout } from '../../controllers/controlador_Usuario.js';
import { serveView } from '../../middlewares/static_Serve.js';

const router = Router();

// Vistas servidas como estáticos
router.get('/login', serveView('login.html'));
router.get('/registro', serveView('registro.html'));

// Acciones
router.post('/login', login);
router.post('/registro', registro);
router.get('/home', home);
router.post('/logout', logout);

export default router;
