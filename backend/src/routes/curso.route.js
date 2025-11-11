// src/routes/curso.route.js
import { Router } from 'express';
import { crearCurso, actualizarCurso, listarCursos } from '../../controllers/curso.controller.js';
import requireAuth from '../../middlewares/requireAuth.js';
import { esAdmin } from '../../middlewares/roles.middleware.js'; // ✅ middleware compartido

const router = Router();

// Rutas protegidas solo para administradores
router.get('/',  requireAuth, esAdmin, listarCursos);
router.post('/', requireAuth, esAdmin, crearCurso);
router.put('/:id', requireAuth, esAdmin, actualizarCurso);

export default router;
