// backend/src/routes/ruta_Usuario.js
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import Usuario from '../models/modelo_Usuario.js';

// ✅ Importamos utilidades
import { encriptarContrasena, verificarContrasena } from '../../utils/encriptar.js';
import { validarNombre, validarCorreo, validarContrasena } from '../../utils/validaciones.js';

const router = Router();

// 🔹 Registro
router.post('/registro', async (req, res) => {
  try {
    const { nombre, correo, contrasena } = req.body;

    // Validaciones
    if (!validarNombre(nombre)) {
      return res.send('<p>❌ Nombre inválido (mínimo 2 caracteres, solo letras y espacios)</p><a href="/">Volver</a>');
    }
    if (!validarCorreo(correo)) {
      return res.send('<p>❌ Correo inválido</p><a href="/">Volver</a>');
    }
    if (!validarContrasena(contrasena)) {
      return res.send('<p>❌ Contraseña inválida (mínimo 6 caracteres)</p><a href="/">Volver</a>');
    }

    // Revisar si ya existe
    const existe = await Usuario.findOne({ where: { correo_usuario: correo } });
    if (existe) {
      return res.send('<p>❌ El correo ya está registrado</p><a href="/">Volver</a>');
    }

    // Encriptar contraseña
    const hash = await encriptarContrasena(contrasena);

    // Crear usuario (rol = 1 por defecto)
    const nuevoUsuario = await Usuario.create({
      nombre,
      correo_usuario: correo,
      contrasena: hash,
      activo: 1,
      id_rol: 1, // Por defecto, rol de 'estudiante' o similar
    });

    return res.status(201).json({
      mensaje: 'Usuario registrado con éxito.',
      usuario: {
        id: nuevoUsuario.id_usuario,
        nombre: nuevoUsuario.nombre,
        correo: nuevoUsuario.correo_usuario,
      },
    });
  } catch (error) {
    console.error('❌ Error en registro:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'El correo ya está registrado.' });
    }
    return res.status(500).json({ error: 'Error en el servidor durante el registro.' });
  }
});

// 🔹 Login
router.post('/login', async (req, res) => {
  try {
    const { correo, contrasena } = req.body;

    // Buscar usuario
    const usuario = await Usuario.findOne({ where: { correo_usuario: correo } });
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verificar contraseña encriptada
    const esValido = await verificarContrasena(contrasena, usuario.contrasena);
    if (!esValido) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Si es correcto, generar JWT
    const payload = {
      id: usuario.id_usuario,
      rol: usuario.id_rol,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '1h', // El token expira en 1 hora
    });

    return res.json({
      mensaje: 'Login exitoso',
      token,
    });
  } catch (error) {
    console.error('❌ Error en login:', error);
    return res.status(500).json({ error: 'Error en el servidor durante el login' });
  }
});

// 🔹 Página después de login
router.get('/inicio', (req, res) => {
  res.send('<h1>Bienvenido a la página de inicio 🎉</h1><a href="/">Cerrar sesión</a>');
});

export default router;
