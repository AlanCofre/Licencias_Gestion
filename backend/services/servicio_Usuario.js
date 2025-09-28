// backend/services/servicio_Usuario.js
import db from '../config/db.js';
import { hashSync, compareSync } from 'bcryptjs';

class UsuarioService {
  // Registro con BD real (si quieres deshabilitarlo cuando estés testeando, quita este método)
  static async registrar(nombre, correo, contrasena, idRol = 2) {
    const [existe] = await db.query(
      'SELECT 1 FROM usuario WHERE correo_usuario = ?',
      [correo]
    );
    if (existe.length > 0) throw new Error('El correo ya está en uso');

    const hash = hashSync(contrasena, 10);

    const [result] = await db.query(
      'INSERT INTO usuario (nombre, correo_usuario, contrasena, activo, id_rol) VALUES (?, ?, ?, 1, ?)',
      [nombre, correo, hash, idRol]
    );

    // devolvemos un objeto plano (¡no un modelo Sequelize!)
    return { id: result.insertId, nombre, correo, id_rol: idRol };
  }

  // Login
  static async login(correo, contrasena) {
    // Si quieres poder probar sin BD, activa AUTH_MOCK=true en .env
    if (process.env.AUTH_MOCK === 'true') {
      const usuarios = [
        { id: 2, nombre: 'Estu',  correo: 'estudiante@demo.com', contrasena: '123456', rol: 'estudiante' },
        { id: 1, nombre: 'Profe', correo: 'profesor@demo.com',   contrasena: '123456', rol: 'profesor'   },
        { id: 3, nombre: 'Secre', correo: 'secretario@demo.com', contrasena: '123456', rol: 'secretario' },
      ];
      const u = usuarios.find(u => u.correo === correo && u.contrasena === contrasena);
      if (!u) throw new Error('Credenciales inválidas (mock)');
      return { id: u.id, nombre: u.nombre, correo: u.correo, rol: u.rol };
    }

    // CON BD
    const [rows] = await db.query(
      'SELECT * FROM usuario WHERE correo_usuario = ? AND activo = 1',
      [correo]
    );
    if (rows.length === 0) throw new Error('Usuario no encontrado');

    const user = rows[0];
    const ok = compareSync(contrasena, user.contrasena);
    if (!ok) throw new Error('Credenciales inválidas');

    let rol = 'estudiante';
    if (user.id_rol === 2) rol = 'estudiante';
    if (user.id_rol === 1) rol = 'profesor';
    if (user.id_rol === 3) rol = 'secretario';

    return { id: user.id_usuario, nombre: user.nombre, correo: user.correo_usuario, rol };
  }
}

export default UsuarioService;
