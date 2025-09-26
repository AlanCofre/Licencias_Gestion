// backend/services/servicio_Usuario.js
import db from '../config/db.js';
import { hash, compare } from 'bcryptjs';

const roleMap = { 1: 'profesor', 2: 'estudiante', 3: 'secretario' };

class UsuarioService {
  // Registro (guarda contraseña hasheada y rol por id)
  static async registrar(nombre, correo, contrasena, idRol = 2) {
    // ¿existe correo?
    const [existe] = await db.query(
      'SELECT 1 FROM usuario WHERE correo_usuario = ?',
      [correo]
    );
    if (existe.length > 0) throw new Error('El correo ya está en uso');

    // hash de contraseña (no bloqueante)
    const passwordHash = await hash(contrasena, 10);

    const [result] = await db.query(
      'INSERT INTO usuario (nombre, correo_usuario, contrasena, activo, id_rol) VALUES (?, ?, ?, 1, ?)',
      [nombre, correo, passwordHash, idRol]
    );

    return {
      id: result.insertId,
      nombre,
      correo,
      id_rol: idRol,
      rol: roleMap[idRol] || 'estudiante'
    };
  }

  // Login
  static async login(correo, contrasena) {
    // Modo mock opcional (para pruebas sin BD)
    if (process.env.AUTH_MOCK === 'true') {
      const usuarios = [
        { id: 1, nombre: 'Estu',  correo: 'estudiante@demo.com', contrasena: '123456', rol: 'estudiante' },
        { id: 2, nombre: 'Profe', correo: 'profesor@demo.com',   contrasena: '123456', rol: 'profesor'   },
        { id: 3, nombre: 'Secre', correo: 'secretario@demo.com', contrasena: '123456', rol: 'secretario' },
      ];
      const u = usuarios.find(u => u.correo === correo && u.contrasena === contrasena);
      if (!u) throw new Error('Credenciales inválidas (mock)');
      return { id: u.id, nombre: u.nombre, correo: u.correo, rol: u.rol, id_rol: u.rol === 'estudiante' ? 2 : u.rol === 'profesor' ? 1 : 3 };
    }

    // Con BD real
    const [rows] = await db.query(
      'SELECT * FROM usuario WHERE correo_usuario = ? AND activo = 1',
      [correo]
    );
    if (rows.length === 0) throw new Error('Usuario no encontrado');

    const user = rows[0];

    // defensa por si el campo viene con espacios o null
    const dbHash = String(user.contrasena || '').trim();

    const ok = await compare(contrasena, dbHash);
    if (!ok) throw new Error('Credenciales inválidas');

    const rol = roleMap[user.id_rol] || 'estudiante';

    return {
      id: user.id_usuario,
      nombre: user.nombre,
      correo: user.correo_usuario,
      rol,           // <-- STRING: 'estudiante' | 'profesor' | 'secretario'
      id_rol: user.id_rol
    };
  }
}

export default UsuarioService;
