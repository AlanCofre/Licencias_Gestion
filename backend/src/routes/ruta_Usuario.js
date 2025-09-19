// backend/src/routes/ruta_Usuario.js
import { Router } from 'express';
import Usuario from '../models/modelo_Usuario.js';

const router = Router();

// 🔹 Registro
router.post('/registro', async (req, res) => {
  try {
    const { nombre, correo, contrasena } = req.body;

    const existe = await Usuario.findOne({ where: { correo_usuario: correo } });
    if (existe) {
      return res.send('<p>❌ El correo ya está registrado</p><a href="/">Volver</a>');
    }

    // Crear usuario con rol estudiante por defecto
    await Usuario.create({
      nombre,
      correo_usuario: correo,
      contrasena,
      id_rol: 1 // 👈 aseguramos que tenga rol
    });

    return res.send('<p>✅ Usuario registrado con éxito</p><a href="/">Iniciar sesión</a>');
  } catch (error) {
    console.error('❌ Error en registro:', error);
    return res.status(500).send('Error en el registro');
  }
});

// 🔹 Login
router.post('/login', async (req, res) => {
  try {
    const { correo, contrasena } = req.body;

    // Buscar usuario
    const usuario = await Usuario.findOne({ where: { correo_usuario: correo } });

    if (!usuario || usuario.contrasena !== contrasena) {
      return res.send('<p>❌ El usuario o la contraseña son incorrectos</p><a href="/">Volver</a>');
    }

    // Si es correcto, redirige a página de inicio
    return res.redirect('/usuarios/inicio');
  } catch (error) {
    console.error(error);
    return res.status(500).send('Error en el login');
  }
});

// 🔹 Página después de login
router.get('/inicio', (req, res) => {
  res.send('<h1>Bienvenido a la página de inicio 🎉</h1><a href="/">Cerrar sesión</a>');
});

export default router;
