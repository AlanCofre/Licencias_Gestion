// backend/src/controllers/auth.controller.js
import bcrypt from 'bcrypt';
import Usuario from '../models/modelo_Usuario.js';
import { generarJWT } from '../utils/jwt.js'; // tu helper ya existente

export async function login(req, res) {
  try {
    const { correo_usuario, contrasena } = req.body || {};
    if (!correo_usuario || !contrasena) {
      return res.status(400).json({ ok: false, error: 'correo_usuario y contrasena son requeridos' });
    }

    // Ajusta el campo si tu columna se llama distinto
    const usuario = await Usuario.findOne({ where: { correo_usuario } });
    if (!usuario) return res.status(401).json({ ok: false, error: 'Credenciales inválidas' });

    const match = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!match) return res.status(401).json({ ok: false, error: 'Credenciales inválidas' });

    // generarJWT espera (id, rol) según tu función:
    const token = await generarJWT(usuario.id_usuario, usuario.id_rol);

    const usuarioSafe = {
      id_usuario: usuario.id_usuario,
      correo_usuario: usuario.correo_usuario,
      nombre: usuario.nombre,
      id_rol: usuario.id_rol,
    };

    return res.json({ ok: true, token, usuario: usuarioSafe });
  } catch (err) {
    console.error('Login error', err);
    return res.status(500).json({ ok: false, error: 'Error interno' });
  }
}
