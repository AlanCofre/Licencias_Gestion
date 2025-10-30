// src/routes/curso.route.js
import { Router } from 'express';
import {
  crearCurso,
  actualizarCurso,
  listarCursos
} from '../../controllers/curso.controller.js';
import requireAuth from '../../middlewares/requireAuth.js';
import Usuario from '../models/modelo_Usuario.js'; 

const router = Router();

// middleware de admin con el id_rol real = 4
const esAdmin = async (req, res, next) => {
  const ROL_ADMIN = 4;
  try {
    if (!req.user) {
      return res.status(401).json({ ok: false, mensaje: 'No autenticado' });
    }

    // en tu requireAuth puede que ya venga el rol
    let rol = req.user.id_rol;

    // si no viene, lo buscamos
    if (!rol) {
      const u = await Usuario.findByPk(req.user.id_usuario);
      rol = u?.id_rol;
    }

    if (rol !== ROL_ADMIN) {
      return res.status(403).json({ ok: false, mensaje: 'No autorizado (solo administrador)' });
    }

    next();
  } catch (err) {
    console.error('error en esAdmin', err);
    return res.status(500).json({ ok: false, mensaje: 'Error validando rol' });
  }
};

// listar
router.get('/', requireAuth, esAdmin, listarCursos);

// crear
router.post('/', requireAuth, esAdmin, crearCurso);

// editar
router.put('/:id', requireAuth, esAdmin, actualizarCurso);

export default router;
