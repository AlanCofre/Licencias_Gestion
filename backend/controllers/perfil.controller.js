import Usuario from '../src/models/modelo_Usuario.js';
import Perfil from '../src/models/modelo_Perfil.js';
import { validarPerfilPayload } from '../src/utils/validaciones_perfil.js';
import db from "../config/db.js";

// GET /api/perfil/me
export async function obtenerMiPerfil(req, res) {
  try {
    const id = req.user.id_usuario; // viene de requireAuth
    const [rows] = await db.execute(
      `SELECT 
         id_usuario,
         nombre,
         correo_usuario AS correoInstitucional,
         activo,
         id_rol
       FROM usuario
       WHERE id_usuario = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ ok: false, error: "Usuario no encontrado" });
    }

    res.json({ ok: true, data: rows[0] });
  } catch (e) {
    console.error("[obtenerMiPerfil]", e);
    res.status(500).json({ ok: false, error: "Error al obtener perfil" });
  }
}

// PUT /api/perfil/me
export async function guardarMiPerfil(req, res) {
  try {
    // No hay campos editables por ahora
    res.json({ ok: true, updated: false, msg: "Sin campos editables en esta versión." });
  } catch (e) {
    console.error("[guardarMiPerfil]", e);
    res.status(500).json({ ok: false, error: "Error guardando perfil" });
  }
}

// GET /api/perfil/usuario/:id_usuario  (útil para vista de otro usuario)
export async function obtenerPerfilPorUsuario(req, res) {
  try {
    const { id_usuario } = req.params;
    const [rows] = await db.execute(
      `SELECT 
         id_usuario,
         nombre,
         email        AS correoInstitucional,
         email_alt    AS correoAlternativo,
         numero_telef AS telefono,
         direccion,
         rol
       FROM usuario
       WHERE id_usuario = ?`,
      [id_usuario]
    );
    if (rows.length === 0) {
      return res.status(404).json({ ok: false, error: "Usuario no encontrado" });
    }
    res.json({ ok: true, data: rows[0] });
  } catch (e) {
    console.error("[obtenerPerfilPorUsuario]", e);
    res.status(500).json({ ok: false, error: "Error al obtener perfil" });
  }
}

export default { obtenerMiPerfil, guardarMiPerfil, obtenerPerfilPorUsuario };