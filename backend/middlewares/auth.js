// backend/middlewares/auth.js
import jwt from 'jsonwebtoken';

// Normaliza el rol (acepta número o string) a: 'profesor' | 'estudiante' | 'secretario'
const normalizeRole = (val) => {
  if (val == null) return undefined;
  const v = String(val).toLowerCase().trim();
  if (v === '1' || v === 'profesor')   return 'profesor';
  if (v === '2' || v === 'estudiante') return 'estudiante';
  if (v === '3' || v === 'secretario') return 'secretario';
  return undefined;
};

// Obtiene token desde Authorization: Bearer ..., x-token o ?token=
const extractToken = (req) => {
  const h = req.header('Authorization') || req.header('authorization') || '';
  if (h.startsWith('Bearer ')) return h.slice(7).trim();
  return req.header('x-token') || req.query?.token || null;
};

export const validarJWT = (req, res, next) => {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ msg: 'No hay token en la petición' });

  try {
    const secret = process.env.JWT_SECRET || 'DEV_SECRET_CHANGE_ME';
    const payload = jwt.verify(token, secret);

    // Soporta distintos nombres de campos en el payload
    const id  = payload.id ?? payload.sub ?? payload.uid ?? payload.userId ?? payload.id_usuario;
    const rol = normalizeRole(payload.rol ?? payload.id_rol ?? payload.role);

    if (!id)  return res.status(401).json({ msg: 'Token sin id' });
    if (!rol) return res.status(401).json({ msg: 'Token sin rol válido' });

    req.id  = id;
    req.rol = rol;
    return next();
  } catch (e) {
    console.error('[validarJWT] error:', e.message);
    return res.status(401).json({ msg: 'Token no válido' });
  }
};

export const esEstudiante = (req, res, next) => {
  if (!req.rol) return res.status(500).json({ msg: 'Verificar rol sin validar token primero' });
  if (req.rol !== 'estudiante') {
    return res.status(403).json({ msg: 'No tiene permisos para realizar esta acción (solo estudiantes)' });
  }
  next();
};

export const tieneRol = (...rolesPermitidos) => {
  const allow = rolesPermitidos.map(r => String(r).toLowerCase().trim());
  return (req, res, next) => {
    if (!req.rol) return res.status(500).json({ msg: 'Verificar rol sin validar token primero' });
    if (!allow.includes(req.rol)) {
      return res.status(403).json({ msg: `Requiere uno de estos roles: ${allow.join(', ')}` });
    }
    next();
  };
};

export default { validarJWT, esEstudiante, tieneRol };
