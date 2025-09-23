import Usuario from '../src/models/modelo_Usuario.js';
import LicenciaMedica from '../src/models/modelo_LicenciaMedica.js';
import { encriptarContrasena, verificarContrasena } from '../utils/encriptar.js';
import { validarNombre, validarCorreo, validarContrasena } from '../utils/validaciones.js';
import jwt from 'jsonwebtoken';
import UsuarioService from '../services/servicio_Usuario.js';

export const mostrarLogin = (req, res) => {
  res.sendFile('login.html', { root: './frontend/public' });
};

export const mostrarRegistro = (req, res) => {
  res.sendFile('registro.html', { root: './fronted/public' });
};


export async function registrar(req, res) {
  try {
    const { nombre, correo, contrasena, idRol } = req.body; // idRol opcional (default 2)
    const usuario = await UsuarioService.registrar(nombre, correo, contrasena, 1);
    
    res.redirect('/usuarios/login');
  } catch (err) {
    console.error('[registrar] error:', err);
    res.status(400).json({ error: err.message || 'Error al registrar' });
  }
};

export async function login(req, res) {
  try {
    const { correo, contrasena } = req.body;
    if (!correo || !contrasena) {
      return res.status(400).json({ error: 'correo y contrasena son requeridos' });
    }

    const usuario = await UsuarioService.login(correo, contrasena); // { id, nombre, correo, rol }

    const token = jwt.sign(
      { id: usuario.id, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    res.redirect('/usuarios/home');
  } catch (err) {
    console.error('[login] error:', err);
    res.status(401).json({ error: err.message || 'Credenciales inválidas' });
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
