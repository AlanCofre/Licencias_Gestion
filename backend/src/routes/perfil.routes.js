import { Router } from 'express';
import requireAuth from '../../middlewares/requireAuth.js';
import * as PerfilCtrl from '../../controllers/perfil.controller.js';

const router = Router();

router.get('/perfil/me', requireAuth, PerfilCtrl.obtenerMiPerfil);
router.put('/perfil/me', requireAuth, PerfilCtrl.guardarMiPerfil);

// (Opcional) sólo para roles con permiso
router.get('/perfil/usuario/:id_usuario', requireAuth, PerfilCtrl.obtenerPerfilPorUsuario);

export default router;
