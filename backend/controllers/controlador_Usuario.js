// backend/controllers/controlador_Usuario.js
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import UsuarioService from '../services/servicio_Usuario.js';

// === Paths para servir HTML de /frontend/public ===
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_ROOT = path.join(__dirname, '..', '..', 'frontend', 'public');

// Vistas simples (opcional)
export const mostrarLogin = (_req, res) => {
  res.sendFile(path.join(PUBLIC_ROOT, 'login.html'));
};

export const mostrarRegistro = (_req, res) => {
  res.sendFile(path.join(PUBLIC_ROOT, 'registro.html'));
};

export const mostrarIndex = (_req, res) => {
  res.sendFile(path.join(PUBLIC_ROOT, 'index.html'));
};

// ===== Registro =====
export async function registrar(req, res) {
  try {
    const { nombre, correo, contrasena, idRol } = req.body;
    // Por defecto, registrar como ESTUDIANTE (2) si no envían idRol
    const roleId = Number.isInteger(idRol) ? idRol : 2;

    const usuario = await UsuarioService.registrar(nombre, correo, contrasena, roleId);
    // Devuelve JSON (más claro para pruebas); si quieres redirigir, cambia aquí
    return res.status(201).json({ mensaje: 'Usuario registrado', usuario });
  } catch (err) {
    console.error('[registrar] error:', err);
    return res.status(400).json({ error: err.message || 'Error al registrar' });
  }
}

// ===== Login (emite JWT con { id, rol }) =====
export async function login(req, res) {
  try {
    const { correo, contrasena } = req.body || {};
    if (!correo || !contrasena) {
      return res.status(400).json({ ok: false, msg: 'correo y contrasena son requeridos' });
    }

    const usuario = await UsuarioService.login(correo, contrasena); // { id, nombre, correo, rol }

    const secret = process.env.JWT_SECRET || 'DEV_SECRET_CHANGE_ME';
    const token = jwt.sign(
      { id: usuario.id, rol: usuario.rol },           // <-- rol STRING
      secret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    // Respuesta API amigable
    return res.json({
      ok: true,
      mensaje: 'Login exitoso',
      usuario,
      token,
    });
  } catch (err) {
    console.error('[login] error:', err);
    return res.status(401).json({ ok: false, msg: err.message || 'Credenciales inválidas' });
  }
}

// ===== Home simple (opcional; sin Sequelize) =====
export const index = (req, res) => {
  res.send(`
    <h1>Licencias — Demo JWT</h1>
    <p>Usa Thunder Client/Postman para probar:</p>
    <ul>
      <li>POST /usuarios/login</li>
      <li>GET  /api/licencias/mis-licencias (con Authorization: Bearer ...)</li>
      <li>POST /api/licencias/crear (sólo estudiante)</li>
      <li>GET  /api/licencias/revisar (profesor o secretario)</li>
    </ul>
  `);
};

// ===== Logout básico (opcional) =====
export const logout = (req, res) => {
  try {
    if (req.session) req.session.destroy(() => {});
    res.clearCookie?.('token');
  } finally {
    return res.redirect('/usuarios/login');
  }
};
