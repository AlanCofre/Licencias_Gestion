// src/routes/perfil.routes.js
import { Router } from 'express';
import requireAuth from '../../middlewares/requireAuth.js';
import * as PerfilCtrl from '../../controllers/perfil.controller.js';
import upload from '../../middlewares/upload.js';
import db from "../../config/db.js";

const router = Router();


router.get('/perfil/me', requireAuth, PerfilCtrl.obtenerMiPerfil);

router.put(
  '/perfil/me',
  requireAuth,
  upload.single('foto'),          // <-- importante para FormData con foto
  PerfilCtrl.guardarMiPerfil
);

router.get(
  '/perfil/usuario/:id_usuario',
  requireAuth,
  PerfilCtrl.obtenerPerfilPorUsuario
);

export default router;
