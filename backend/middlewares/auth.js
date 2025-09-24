// backend/src/middlewares/auth.js  (ESM unificado)
import jwt from 'jsonwebtoken';
import * as Models from '../src/models/index.js';

// Soporte flexible de modelos (según cómo los exportes en tu proyecto)
const Usuario = Models.Usuario || Models.User || Models.Users || null;

function extractToken(req) {
  const h = req.header('Authorization') || req.header('authorization') || '';
  if (h.startsWith('Bearer ')) return h.slice(7);
  return req.header('x-token') || req.query?.token || null;
}

/**
 * validarJWT:
 * - Acepta token en Authorization: Bearer, x-token o query ?token=
 * - Verifica JWT y expone req.id / req.rol
 * - (si hay modelo Usuario) carga req.user y caduca tokens viejos si cambió la contraseña
 */
export const validarJWT = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) return res.status(401).json({ msg: 'No hay token en la petición' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Soporta ambos esquemas de payload (auth.js usaba sub; auth_v.js usaba id/rol)
    const userId = payload.sub ?? payload.id ?? payload.uid ?? payload.userId ?? null;
    const rol = payload.rol ?? payload.role ?? null;

    req.id = userId;
    req.rol = rol;

    // Cargar usuario y validar cambio de contraseña (si el modelo existe)
    if (Usuario && userId != null) {
      const user = await Usuario.findByPk(userId);
      if (!user) return res.status(401).json({ msg: 'No autorizado' });

      // Invalidar token si la contraseña cambió después de emitirse (iat)
      if (user.password_changed_at && payload.iat) {
        const iatMs = payload.iat * 1000;
        const pwdChangedMs = new Date(user.password_changed_at).getTime();
        if (iatMs < pwdChangedMs) {
          return res.status(401).json({ msg: 'Sesión inválida. Inicia sesión nuevamente.' });
        }
      }
      req.user = user;
    }

    return next();
  } catch (error) {
    console.error('[auth] validarJWT error:', error);
    return res.status(401).json({ msg: 'Token no válido' });
  }
};

export const authRequired = validarJWT;

/** SOLO estudiantes */
export const esEstudiante = (req, res, next) => {
  if (!req.rol) return res.status(500).json({ msg: 'Primero valida el token antes de verificar roles' });
  if (req.rol !== 'estudiante') {
    return res.status(403).json({ msg: 'No tiene permisos para realizar esta acción (solo estudiantes)' });
  }
  next();
};

/** Permite varios roles */
export const tieneRol = (...rolesPermitidos) => (req, res, next) => {
  if (!req.rol) return res.status(500).json({ msg: 'Primero valida el token antes de verificar roles' });
  if (!rolesPermitidos.includes(req.rol)) {
    return res.status(403).json({ msg: `Requiere uno de estos roles: ${rolesPermitidos}` });
  }
  next();
};

// Por si en algún lugar lo importan como default
export default { validarJWT, authRequired, esEstudiante, tieneRol };
