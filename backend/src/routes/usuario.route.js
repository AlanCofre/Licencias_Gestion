import { login, registrar, home, logout } from '../../controllers/controlador_Usuario.js';
import { serveView } from '../../middlewares/static_Serve.js';
import { Router } from 'express';

const router = Router();
// Vistas servidas como estáticos
router.get('/login', serveView('login.html'));
router.get('/registro', serveView('registro.html'));

// Acciones
router.post('/login', login);
router.post('/registro', registrar);
router.get('/home', home);
router.post('/logout', logout);

export default router;