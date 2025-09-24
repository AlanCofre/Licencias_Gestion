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
export const mostrarIndex = (req, res) => {
  res.sendFile('index.html', { root: './frontend/public' });
}


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


    res.redirect('/usuarios/index');
  } catch (err) {
    console.error('[login] error:', err);
    res.status(401).json({ error: err.message || 'Credenciales inválidas' });
  }
};

// Página home con resumen
export const index = async (req, res) => {


  // redirige a un archivo HTML en vez de mandar HTML inline
  res.sendFile('index.html', { root: './frontend/public' });
};

// Cerrar sesión
export const logout = (req, res) => {
  req.session.destroy(() => res.redirect('/usuarios/login'));
};
