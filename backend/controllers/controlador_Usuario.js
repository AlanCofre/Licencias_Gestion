import Usuario from '../src/models/modelo_Usuario.js';
import LicenciaMedica from '../src/models/modelo_LicenciaMedica.js';
import { encriptarContrasena, verificarContrasena } from '../utils/encriptar.js';
import { validarNombre, validarCorreo, validarContrasena } from '../utils/validaciones.js';

// Mostrar formularios
export const mostrarLogin = (req, res) => {
  res.sendFile('login.html', { root: './frontend/public' });
};

export const mostrarRegistro = (req, res) => {
  res.sendFile('registro.html', { root: './fronted/public' });
};

// Registrar usuario
export const registro = async (req, res) => {
  try {
    const { nombre, correo, contrasena } = req.body;

    // Validaciones
    if (!validarNombre(nombre)) return res.send('❌ Nombre inválido');
    if (!validarCorreo(correo)) return res.send('❌ Correo inválido');
    if (!validarContrasena(contrasena)) return res.send('❌ La contraseña debe tener al menos 6 caracteres');

    const existe = await Usuario.findOne({ where: { correo_usuario: correo } });
    if (existe) return res.send('❌ Correo ya registrado');

    // Encriptar contraseña antes de guardar
    const hash = encriptarContrasena(contrasena);

    await Usuario.create({
      nombre,
      correo_usuario: correo,
      contrasena: hash,
      id_rol: 1
    });

    res.redirect('/usuarios/login');
  } catch (err) {
    console.error('Error en registro:', err);
    res.status(500).send('Error al registrar usuario');
  }
};

// Iniciar sesión
export const login = async (req, res) => {
  try {
    const { correo, contrasena } = req.body;
    const usuario = await Usuario.findOne({ where: { correo_usuario: correo } });

    if (!usuario || !verificarContrasena(contrasena, usuario.contrasena)) {
      return res.send('<p>❌ Usuario o contraseña incorrectos</p><a href="/usuarios/login">Volver</a>');
    }

    req.session.userId = usuario.id_usuario;
    res.redirect('/usuarios/home');
  } catch (err) {
    res.status(500).send('Error al iniciar sesión');
  }
};

// Página home con resumen
export const home = async (req, res) => {
  if (!req.session.userId) return res.redirect('/usuarios/login');
  
  const id_usuario = req.session.userId;

  const aceptadas = await LicenciaMedica.count({ where: { id_usuario, estado: 'aceptado' } });
  const pendientes = await LicenciaMedica.count({ where: { id_usuario, estado: 'pendiente' } });
  const rechazadas = await LicenciaMedica.count({ where: { id_usuario, estado: 'rechazado' } });

  res.send(`
    <h1>Resumen</h1>
    <p>Aceptadas: ${aceptadas}</p>
    <p>Pendientes: ${pendientes}</p>
    <p>Rechazadas: ${rechazadas}</p>
    <form method="POST" action="/usuarios/logout"><button type="submit">Cerrar sesión</button></form>
  `);
};

// Cerrar sesión
export const logout = (req, res) => {
  req.session.destroy(() => res.redirect('/usuarios/login'));
};
