import UsuarioService from '../services/servicio_Usuario.js';

export async function registrar(req, res) {
  const { nombre, correo, contrasena } = req.body;
  try {
    const usuario = await UsuarioService.registrar(nombre, correo, contrasena);
    res.json({ mensaje: 'Usuario registrado', usuario });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function login(req, res) {
  const { correo, contrasena } = req.body;
  try {
    const usuario = await UsuarioService.login(correo, contrasena);
    res.json({ mensaje: 'Login exitoso', usuario });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
}
