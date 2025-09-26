// controllers/controlador_Usuario.js
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
  // (tenías un typo "fronted")
  res.sendFile('registro.html', { root: './frontend/public' });
};

export const mostrarIndex = (req, res) => {
  // (tenías un typo "fronted")
  res.sendFile('index.html', { root: './frontend/public' });
};

export async function registrar(req, res) {
  try {
    const { nombre, correo, contrasena, idRol } = req.body; // idRol opcional
    await UsuarioService.registrar(nombre, correo, contrasena, idRol ?? 1);
    return res.redirect('/usuarios/login');
  } catch (err) {
    console.error('[registrar] error:', err);
    return res.status(400).json({ error: err.message || 'Error al registrar' });
  }
}

/**
 * LOGIN
 * - Si el cliente pide JSON (fetch / API), responde { ok, token, user }
 * - Si es navegador, setea cookie + session y redirige a /usuarios/index
 */
export async function login(req, res) {
  try {
    const { correo, contrasena } = req.body || {};
    if (!correo || !contrasena) {
      return res.status(400).json({ ok: false, msg: 'correo y contrasena son requeridos' });
    }

    // Autentica con tu servicio (debe lanzar error si falla)
    const usuario = await UsuarioService.login(correo, contrasena);
    // Normaliza ids para compatibilidad
    const userId = usuario.id ?? usuario.id_usuario;

    // Genera JWT (incluye ambas claves para compatibilidad con middlewares/HTML)
    const payload = { id: userId, id_usuario: userId, rol: usuario.rol };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    });

    // Guarda en sesión para tu página index clásica
    if (req.session) req.session.userId = userId;

    // ¿Cliente quiere JSON?
    const wantsJson =
      req.headers.accept?.includes('application/json') ||
      req.is?.('application/json') ||
      req.get?.('x-requested-with') === 'fetch';

    if (wantsJson) {
      return res.json({
        ok: true,
        token,
        user: {
          id_usuario: userId,
          id: userId,
          nombre: usuario.nombre,
          correo: usuario.correo || correo,
          rol: usuario.rol,
        },
      });
    }

    // Fallback clásico: cookie httpOnly + redirect
    res.cookie?.('token', token, { httpOnly: true, sameSite: 'lax' });
    return res.redirect('/usuarios/index');
  } catch (err) {
    console.error('[login] error:', err);
    return res.status(401).json({ ok: false, msg: err.message || 'Credenciales inválidas' });
  }
}

// Página home con resumen (usa session.userId)
export const index = async (req, res) => {
  if (!req.session?.userId) return res.redirect('/usuarios/login');

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
  try {
    if (req.session) req.session.destroy(() => {});
    res.clearCookie?.('token');
  } finally {
    return res.redirect('/usuarios/login');
  }
};
