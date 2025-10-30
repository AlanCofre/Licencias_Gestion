// src/routes/curso.route.js
import { Router } from 'express';
import { crearCurso, actualizarCurso, listarCursos } from '../../controllers/curso.controller.js';
import requireAuth from '../../middlewares/requireAuth.js';

const router = Router();

// Middleware: solo administradores
const esAdmin = (req, res, next) => {
  const rol = req.user?.rol?.toLowerCase?.() || '';
  if (rol !== 'administrador') {
    return res.status(403).json({ ok: false, mensaje: 'Acceso denegado: solo administradores' });
  }
  next();
};

// Rutas
router.get('/', requireAuth, esAdmin, listarCursos);
router.post('/', requireAuth, esAdmin, crearCurso);
router.put('/:id', requireAuth, esAdmin, actualizarCurso);

export default router;
