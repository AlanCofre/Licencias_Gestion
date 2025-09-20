import { Router } from 'express';
import { verificarToken, esAdmin } from '../../middlewares/auth.js';
import Usuario from '../models/modelo_Usuario.js';

const router = Router();

// Ruta protegida que requiere cualquier token válido
// Devuelve la información del usuario que está en el token
router.get('/perfil', verificarToken, async (req, res) => {
  try {
    // El middleware 'verificarToken' ya ha puesto la info del usuario en req.usuario
    const usuario = await Usuario.findByPk(req.usuario.id, {
      // Excluimos la contraseña de la respuesta
      attributes: { exclude: ['contrasena'] }
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    res.json({
      mensaje: 'Acceso a ruta protegida exitoso.',
      usuario,
    });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// Ruta protegida que requiere rol de administrador
router.get('/admin', [verificarToken, esAdmin], (req, res) => {
  res.json({
    mensaje: '¡Bienvenido, Administrador!',
    usuario: req.usuario, // Muestra la info del token
  });
});

export default router;
