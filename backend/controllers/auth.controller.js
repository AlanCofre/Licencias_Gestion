// backend/controllers/auth.controller.js
import bcrypt from 'bcryptjs'
import db from '../config/db.js'
import { generarJWT } from '../utils/jwt.js'
import { auditLog } from '../services/audit.service.js' // ⬅️ registra en logauditoria (mysql2)

/**
 * POST /usuarios/login
 * Body: { correo|correo_usuario, contrasena }
 */
export async function login(req, res) {
  try {
    const correo = req.body?.correo || req.body?.correo_usuario
    const contrasena = req.body?.contrasena

    if (!correo || !contrasena) {
      return res.status(400).json({ ok: false, error: 'correo y contrasena son requeridos' })
    }

    // Trae nombre del rol y el id_rol numérico
    const [rows] = await db.execute(
      `SELECT u.id_usuario, u.nombre, u.correo_usuario, u.contrasena, u.activo,
              u.id_rol AS id_rol_num, r.nombre_rol
         FROM usuario u
         JOIN rol r ON r.id_rol = u.id_rol
        WHERE u.correo_usuario = ?
        LIMIT 1`,
      [correo]
    )

    if (!rows.length) {
      return res.status(401).json({ ok: false, error: 'Credenciales inválidas' })
    }

    const u = rows[0]
    if (!u.activo) {
      return res.status(401).json({ ok: false, error: 'Usuario inactivo' })
    }

    const ok = await bcrypt.compare(contrasena, u.contrasena)
    if (!ok) {
      return res.status(401).json({ ok: false, error: 'Credenciales inválidas' })
    }

    const rolNombre = String(u.nombre_rol || '').toLowerCase() // 'funcionario' | 'estudiante'
    const token = await generarJWT(u.id_usuario, rolNombre)

    // 🔎 AUDITORÍA: registrar inicio de sesión (con id_usuario real)
    try {
      await auditLog({
        id_usuario: u.id_usuario,
        accion: 'iniciar sesion',
        recurso: 'Usuario',
        payload: {
          mensaje: `Usuario ${u.id_usuario} inició sesión`,
          email: u.correo_usuario,
          rol: rolNombre
        },
        ip: req.ip || req.headers['x-forwarded-for'] || null
      })
    } catch (e) {
      // No romper el login si falla el log
      console.warn('[audit] login audit failed:', e?.message || e)
    }

    return res.json({
      ok: true,
      mensaje: 'Login exitoso',
      usuario: {
        id_usuario: u.id_usuario,
        correo_usuario: u.correo_usuario,
        nombre: u.nombre,
        id_rol: u.id_rol_num, // numérico (1|2)
        rol: rolNombre        // string normalizado
      },
      token
    })
  } catch (err) {
    console.error('Login error', err)
    return res.status(500).json({ ok: false, error: 'Error interno' })
  }
}
