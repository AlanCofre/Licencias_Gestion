import db from '../config/db.js';
import Usuario from '../src/models/modelo_Usuario.js';

class UsuarioService {
  // Registro
  static async registrar(nombre, correo, contrasena, idRol = 2) {
    const [existe] = await db.query(
      'SELECT * FROM Usuario WHERE correo_usuario = ?',
      [correo]
    );
    if (existe.length > 0) {
      throw new Error('El correo ya está en uso');
    }

    const [result] = await db.query(
      'INSERT INTO Usuario (nombre, correo_usuario, contrasena, activo, id_rol) VALUES (?, ?, ?, 1, ?)',
      [nombre, correo, contrasena, idRol]
    );

    return new Usuario(result.insertId, nombre, correo, contrasena, 1, idRol);
  }

  // Login
  static async login(correo, contrasena) {
    const [rows] = await db.query(
      'SELECT * FROM Usuario WHERE correo_usuario = ? AND activo = 1',
      [correo]
    );
    if (rows.length === 0) throw new Error('Usuario no encontrado');

    const user = rows[0];
    if (user.contrasena !== contrasena) throw new Error('Credenciales inválidas');

    return new Usuario(
      user.id_usuario,
      user.nombre,
      user.correo_usuario,
      user.contrasena,
      user.activo,
      user.id_rol
    );
  }
}

export default UsuarioService;
