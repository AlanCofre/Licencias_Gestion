// backend/middlewares/auth.js
import jwt from 'jsonwebtoken';
import db from '../config/db.js';

/* ============================
 * Constantes de rol (canónicos)
 * ============================ */
export const ROLES = {
  ADMIN: 'administrador',
  PROF:  'profesor',
  EST:   'estudiante',
  FUNC:  'funcionario',
};

/* ============================
 * Utilidades
 * ============================ */
const extractToken = (req) => {
  const h = req.header('Authorization') || req.header('authorization') || '';
  if (h.startsWith('Bearer ')) return h.slice(7).trim();
  return req.header('x-token') || req.query?.token || null;
};

const normalizeRol = (raw) => {
  if (raw == null) return null;
  const v = String(raw).toLowerCase().trim();

  // === IDs de la tabla "rol" ===
  if (v === '1') return ROLES.PROF;   // profesor
  if (v === '2') return ROLES.EST;    // estudiante
  if (v === '3') return ROLES.FUNC;   // funcionario
  if (v === '4') return ROLES.ADMIN;  // administrador

  // === Nombres / alias ===
  if (v === 'profesor' || v === 'profesora') return ROLES.PROF;
  if (v === 'estudiante' || v === 'alumno')  return ROLES.EST;
  if (v === 'funcionario')                    return ROLES.FUNC;
  if (v === 'administrador' || v === 'admin' || v === 'administradora') return ROLES.ADMIN;

  return null;
};

/* ============================
 * Middleware: validarJWT
 * - Verifica token
 * - Normaliza rol (desde token o BD)
 * - Setea req.user y compat en req.id / req.rol
 * ============================ */
export const validarJWT = async (req, res, next) => {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ msg: 'No hay token en la petición' });

  try {
    const secret = process.env.JWT_SECRET || 'DEV_SECRET_CHANGE_ME';
    const payload = jwt.verify(token, secret);

    // id puede venir con distintos nombres
    const id_usuario =
      payload.id ?? payload.sub ?? payload.uid ?? payload.userId ?? payload.id_usuario ?? null;

    let rol = normalizeRol(payload.rol ?? payload.id_rol ?? payload.role ?? null);

    // Si el token no trae rol válido, intenta resolverlo desde la BD
    if (!rol && id_usuario) {
      const [rows] = await db.execute(
        `SELECT r.nombre_rol AS rol
           FROM usuario u
           JOIN rol r ON r.id_rol = u.id_rol
          WHERE u.id_usuario = ?
          LIMIT 1`,
        [id_usuario]
      );
      if (rows.length) rol = normalizeRol(rows[0].rol);
    }

    if (!id_usuario) return res.status(401).json({ msg: 'Token sin id válido' });
    if (!rol)        return res.status(401).json({ msg: 'Token sin rol válido' });

    // Set moderno + compat con código viejo
    req.user = { id_usuario, rol };
    req.id   = id_usuario; // compat legado
    req.rol  = rol;        // compat legado

    next();
  } catch (e) {
    console.error('[validarJWT] error:', e.message);
    return res.status(401).json({ msg: 'Token no válido' });
  }
};

/* ============================
 * Requiere estudiante (legacy)
 * ============================ */
export const esEstudiante = (req, res, next) => {
  const rol = normalizeRol(req.user?.rol ?? req.rol);
  if (!rol) return res.status(401).json({ msg: 'Token sin rol válido' });
  if (rol !== ROLES.EST) {
    return res.status(403).json({ msg: 'No tiene permisos para realizar esta acción (solo estudiantes)' });
  }
  next();
};

/* ============================
 * Requiere uno de los roles permitidos
 * ============================ */
export const tieneRol = (...rolesPermitidos) => {
  const allow = rolesPermitidos.map((r) => String(r).toLowerCase().trim());
  return (req, res, next) => {
    const rol = normalizeRol(req.user?.rol ?? req.rol);
    if (!rol) return res.status(401).json({ msg: 'Token sin rol válido' });
    if (!allow.includes(rol)) {
      return res.status(403).json({ msg: `Requiere uno de estos roles: ${allow.join(', ')}` });
    }
    next();
  };
};

/* ============================
 * Wrappers sin duplicar lógica
 * ============================ */
export const esAdmin       = tieneRol(ROLES.ADMIN);
export const esProfesor    = tieneRol(ROLES.PROF);
export const esFuncionario = tieneRol(ROLES.FUNC);

// Export default por compatibilidad
export default {
  ROLES,
  validarJWT,
  esEstudiante,
  tieneRol,
  esAdmin,
  esProfesor,
  esFuncionario,
};
