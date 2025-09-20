// backend/src/routes/ruta_Usuario.js
import { Router } from 'express';
import Usuario from '../models/modelo_Usuario.js';
import Rol from '../models/modelo_Rol.js';
import { generarJWT } from '../../utils/jwt.js';
import { validarJWT, esEstudiante } from '../../middlewares/auth.js';

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
    await Usuario.create({
      nombre,
      correo_usuario: correo,
      contrasena: hash,
      activo: 1,
      id_rol: 1
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
    const usuario = await Usuario.findOne({
      where: { correo_usuario: correo },
      include: { model: Rol }
    });
    if (!usuario) {
      return res.status(400).json({ msg: 'Usuario o contraseña incorrectos' });
    }

    // Verificar contraseña encriptada
    const esValido = await verificarContrasena(contrasena, usuario.contrasena);
    if (!esValido) {
      return res.status(400).json({ msg: 'Usuario o contraseña incorrectos' });
    }

    // Generar JWT
    const token = await generarJWT(usuario.id_usuario, usuario.Rol.nombre_rol);

    res.redirect(`/usuarios/inicio?token=${token}`);

  } catch (error) {
    console.error('❌ Error en login:', error);
    return res.status(500).send('Error en el login');
  }
});

// 🔹 Página después de login
router.get('/inicio', [
  validarJWT,
  esEstudiante
], (req, res) => {
  res.send('<h1>Bienvenido a la página de inicio 🎉</h1><a href="/">Cerrar sesión</a>');
});

export default router;
