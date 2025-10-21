// controllers/perfil.controller.js
import db from "../config/db.js";
import { validarPerfilPayload } from "../src/utils/validaciones_perfil.js"; // valida email_alt, numero_telef, direccion, foto_url
// Nota: este controlador usa SQL plano contra tablas: usuario, perfil

function _buildPerfilFromRow(row) {
  return {
    email_alt: row.email_alt ?? null,
    numero_telef: row.numero_telef ?? null,
    direccion: row.direccion ?? null,
    foto_url: row.foto_url ?? null,
  };
}

// GET /api/perfil/me
export async function obtenerMiPerfil(req, res) {
  try {
    const id = req.user.id_usuario; // viene de requireAuth
    const [rows] = await db.execute(
      `SELECT 
          u.id_usuario,
          u.nombre,
          u.correo_usuario AS correoInstitucional,
          u.activo,
          u.id_rol,
          p.email_alt,
          p.numero_telef,
          p.direccion,
          p.foto_url
       FROM usuario u
       LEFT JOIN perfil p ON p.id_usuario = u.id_usuario
       WHERE u.id_usuario = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ ok: false, error: "Usuario no encontrado" });
    }

    const u = rows[0];
    return res.json({
      ok: true,
      data: {
        id_usuario: u.id_usuario,
        nombre: u.nombre,
        correoInstitucional: u.correoInstitucional,
        activo: u.activo,
        id_rol: u.id_rol,
        perfil: _buildPerfilFromRow(u),
      },
    });
  } catch (e) {
    console.error("[obtenerMiPerfil]", e);
    return res.status(500).json({ ok: false, error: "Error al obtener perfil" });
  }
}

// PUT /api/perfil/me
export async function guardarMiPerfil(req, res) {
  try {
    const id = req.user.id_usuario;

    // 1) Construir payload desde body (sea JSON o multipart/form-data)
    const body = {
      email_alt: req.body?.email_alt ?? null,
      numero_telef: req.body?.numero_telef ?? null,
      direccion: req.body?.direccion ?? null,
      foto_url: req.body?.foto_url ?? null,
    };

    // Si vino archivo (upload.single('foto')), intentar tomar su URL/ruta
    if (req.file) {
      // adapta según tu middleware de storage:
      // - local: req.file.path
      // - supabase/s3: quizá req.file.location o un campo personalizado
      body.foto_url = req.file.location || req.file.path || body.foto_url || null;
    }

    // 2) Validar
    const { valido, errores, data } = validarPerfilPayload(body);
    if (!valido) {
      return res.status(400).json({ ok: false, error: "Payload inválido", detalles: errores });
    }

    // 3) UPSERT a tabla perfil (id_usuario es UNIQUE)
    await db.execute(
      `INSERT INTO perfil (id_usuario, email_alt, numero_telef, direccion, foto_url)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         email_alt = VALUES(email_alt),
         numero_telef = VALUES(numero_telef),
         direccion = VALUES(direccion),
         foto_url = VALUES(foto_url)`,
      [id, data.email_alt, data.numero_telef, data.direccion, data.foto_url]
    );

    // 4) Devolver el estado actualizado
    const [rows] = await db.execute(
      `SELECT p.email_alt, p.numero_telef, p.direccion, p.foto_url
       FROM perfil p
       WHERE p.id_usuario = ?`,
      [id]
    );

    const perfil = rows[0] || { email_alt: null, numero_telef: null, direccion: null, foto_url: null };

    return res.json({ ok: true, data: perfil });
  } catch (e) {
    console.error("[guardarMiPerfil]", e);
    return res.status(500).json({ ok: false, error: "Error guardando perfil" });
  }
}

// GET /api/perfil/usuario/:id_usuario
export async function obtenerPerfilPorUsuario(req, res) {
  try {
    const { id_usuario } = req.params;
    const [rows] = await db.execute(
      `SELECT 
          u.id_usuario,
          u.nombre,
          u.correo_usuario AS correoInstitucional,
          u.activo,
          u.id_rol,
          p.email_alt,
          p.numero_telef,
          p.direccion,
          p.foto_url
       FROM usuario u
       LEFT JOIN perfil p ON p.id_usuario = u.id_usuario
       WHERE u.id_usuario = ?`,
      [id_usuario]
    );

    if (rows.length === 0) {
      return res.status(404).json({ ok: false, error: "Usuario no encontrado" });
    }

    const u = rows[0];
    return res.json({
      ok: true,
      data: {
        id_usuario: u.id_usuario,
        nombre: u.nombre,
        correoInstitucional: u.correoInstitucional,
        activo: u.activo,
        id_rol: u.id_rol,
        perfil: _buildPerfilFromRow(u),
      },
    });
  } catch (e) {
    console.error("[obtenerPerfilPorUsuario]", e);
    return res.status(500).json({ ok: false, error: "Error al obtener perfil" });
  }
}

export const NotificacionesPassword = async (req, res) => {
  try {
    const { id_usuario } = req.user;

    const [notificaciones] = await db.execute(
      'SELECT id_notificacion, asunto, contenido, fecha_envio FROM notificaciones WHERE id_usuario = ? AND asunto = ? ORDER BY fecha_envio DESC',
      [id_usuario, 'Cambio de contraseña']
    );

    console.log('🔐 Notificaciones de cambio de contraseña:', notificaciones);

    res.json({ ok: true, mensaje: 'Notificaciones de contraseña mostradas en terminal' });
  } catch (e) {
    console.error('❌ Error al obtener notificaciones de contraseña:', e);
    res.status(500).json({ ok: false, error: e.message });
  }
};


export const NotificacionesPerfil = async (req, res) => {
  try {
    const { id_usuario } = req.user;

    const [notificaciones] = await db.execute(
      'SELECT id_notificacion, asunto, contenido, fecha_envio FROM notificaciones WHERE id_usuario = ? AND asunto = ? ORDER BY fecha_envio DESC',
      [id_usuario, 'Actualización de perfil']
    );

    console.log('👤 Notificaciones de modificación de perfil:', notificaciones);

    res.json({ ok: true, mensaje: 'Notificaciones de perfil mostradas en terminal' });
  } catch (e) {
    console.error('❌ Error al obtener notificaciones de perfil:', e);
    res.status(500).json({ ok: false, error: e.message });
  }
};
