// backend/controllers/controlador_Usuario.js
import jwt from 'jsonwebtoken';
import UsuarioService from '../services/servicio_Usuario.js';

export async function registrar(req, res) {
  try {
    const { nombre, correo, contrasena, idRol } = req.body; // idRol opcional (default 2)
    const usuario = await UsuarioService.registrar(nombre, correo, contrasena, idRol);
    res.json({ mensaje: 'Usuario registrado', usuario });
  } catch (err) {
    console.error('[registrar] error:', err);
    res.status(400).json({ error: err.message || 'Error al registrar' });
  }
}

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

    res.json({ mensaje: 'Login exitoso', usuario, token });
  } catch (err) {
    console.error('[login] error:', err);
    res.status(401).json({ error: err.message || 'Credenciales inválidas' });
  }
}
