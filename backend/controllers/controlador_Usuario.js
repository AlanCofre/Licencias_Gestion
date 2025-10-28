// backend/controllers/controlador_Usuario.js
import path from 'path'
import { fileURLToPath } from 'url'
import jwt from 'jsonwebtoken'
import UsuarioService from '../services/servicio_Usuario.js'

// === Paths para servir HTML de /frontend/public ===
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PUBLIC_ROOT = path.join(__dirname, '..', '..', 'frontend', 'public')

// Vistas simples (opcional)
export const mostrarLogin = (_req, res) => {
  res.sendFile(path.join(PUBLIC_ROOT, 'login.html'))
}

export const mostrarRegistro = (_req, res) => {
  res.sendFile(path.join(PUBLIC_ROOT, 'registro.html'))
}

export const mostrarIndex = (_req, res) => {
  res.sendFile(path.join(PUBLIC_ROOT, 'index.html'))
}

// ===== Registro =====
export async function registrar(req, res) {
  try {
    const b = req.body || {}

    // Normalizar posibles nombres que pueda mandar el FE
    const nombre =
      b.nombre ?? b.name ?? b.nombre_completo ?? b.fullname ?? null

    const correo_usuario =
      b.correo_usuario ?? b.correo ?? b.email ?? b.username ?? null

    const contrasena =
      b.contrasena ?? b.password ?? b.pass ?? b.pwd ?? null

    // Rol por defecto: estudiante (ID 2) – ajusta si tu BD usa otro ID
    const roleId = Number.isInteger(b.idRol) ? b.idRol : 2

    // Validación mínima
    if (!nombre || !correo_usuario || !contrasena) {
      return res.status(400).json({
        ok: false,
        error: 'Faltan campos requeridos: nombre, correo_usuario y contrasena',
        body_recibido: Object.keys(b)
      })
    }

    const usuario = await UsuarioService.registrar(
      nombre,
      correo_usuario,
      contrasena,
      roleId
    )

    // 🔎 AUDIT: crear cuenta (no romper respuesta si falla)
    try {
      await req.audit('crear cuenta', 'Usuario', {
        mensaje: `Estudiante ${correo_usuario} creó su cuenta`,
        id_usuario_creado: usuario?.id_usuario ?? usuario?.id ?? null,
        nombre
      })
    } catch (e) {
      console.warn('[audit] registrar:', e?.message || e)
    }

    return res.status(201).json({ ok: true, mensaje: 'Usuario registrado', usuario })
  } catch (err) {
    console.error('[registrar] error:', err)
    return res.status(400).json({ ok: false, error: err.message || 'Error al registrar' })
  }
}

// ===== Login (emite JWT con { id, rol }) =====
export async function login(req, res) {
  try {
    // Acepta varios nombres de campo por compatibilidad con distintos clientes
    const body = req.body || {}
    const correoIn =
      body.correo_usuario ||
      body.correo ||
      body.email ||
      body.username ||
      body.user
    const contrasena =
      body.contrasena || body.password || body.pass || body.pwd

    if (!correoIn || !contrasena) {
      return res.status(400).json({ ok: false, msg: 'correo y contrasena son requeridos' })
    }

    // UsuarioService.login espera (correo, contrasena)
    const usuario = await UsuarioService.login(correoIn, contrasena)
    // UsuarioService.login debe lanzar error o devolver null si credenciales inválidas
    if (!usuario) {
      return res.status(401).json({ ok: false, msg: 'Credenciales inválidas' })
    }

    // Normalizar propiedades del usuario retornado (por si usa id_usuario / id_rol)
    const id = usuario.id ?? usuario.id_usuario ?? usuario.idUsuario ?? usuario.userId
    const rol =
      usuario.rol ?? usuario.id_rol ?? usuario.role ?? usuario.roleId ?? usuario.idRol
    // opcionales
    const correo_usuario =
      usuario.correo_usuario ?? usuario.correo ?? usuario.email ?? usuario.username
    const nombre =
      usuario.nombre ?? usuario.nombre_completo ?? usuario.name ?? usuario.fullname

    if (!id) {
      // Si el servicio no retorna id, es un problema: devolver error controlado
      console.error('[login] usuario retornado sin id:', usuario)
      return res.status(500).json({ ok: false, msg: 'Error interno: usuario inválido' })
    }

    const secret = process.env.JWT_SECRET || 'DEV_SECRET_CHANGE_ME'
    const expiresIn = process.env.JWT_EXPIRES_IN || '1d'

    // Firma el token con la forma que ya usabas: { id, rol }
    const token = jwt.sign({ id, rol }, secret, { expiresIn })

    const usuarioSafe = {
      id_usuario: id,
      correo_usuario,
      nombre,
      id_rol: rol
    }

    // 🔎 AUDIT: iniciar sesión (no romper respuesta si falla)
    try {
      await req.audit('iniciar sesion', 'Usuario', {
        mensaje: `Usuario ${id} inició sesión`,
        email: correo_usuario,
        rol
      })
    } catch (e) {
      console.warn('[audit] login:', e?.message || e)
    }

    return res.json({
      ok: true,
      mensaje: 'Login exitoso',
      usuario: usuarioSafe,
      token
    })
  } catch (err) {
    console.error('[login] error:', err)
    // Si el servicio lanzó un error con mensaje (p. ej. credenciales), devuélvelo como 401
    const msg = err?.message || 'Credenciales inválidas'
    return res.status(401).json({ ok: false, msg })
  }
}

// ===== Home simple (opcional; sin Sequelize) =====
export const index = (_req, res) => {
  res.send(`
    <h1>Licencias — Demo JWT</h1>
    <p>Usa Thunder Client/Postman para probar:</p>
    <ul>
      <li>POST /usuarios/login</li>
      <li>GET  /api/licencias/mis-licencias (con Authorization: Bearer ...)</li>
      <li>POST /api/licencias/crear (sólo estudiante)</li>
      <li>GET  /api/licencias/revisar (profesor o secretario)</li>
    </ul>
  `)
}

// ===== Logout básico (opcional) =====
export const logout = (req, res) => {
  try {
    if (req.session) req.session.destroy(() => {})
    res.clearCookie?.('token')
  } finally {
    return res.redirect('/usuarios/login')
  }
}
