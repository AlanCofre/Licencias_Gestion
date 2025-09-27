// backend/middlewares/requireAuth.js
import jwt from 'jsonwebtoken';

// Middleware principal (default export)
export default function requireAuth(req, res, next) {
  const hdr = req.headers.authorization || '';
  const [type, token] = hdr.split(' ');

  if (type !== 'Bearer' || !token) {
    return res.status(401).json({ ok: false, error: 'Token requerido' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'devsecret');

    // Ajusta según lo que guardes en tu token
    req.user = {
      id_usuario: payload.id_usuario ?? payload.id ?? 0,
      rol: payload.rol ?? 'Estudiante'
    };

    return next();
  } catch (e) {
    const msg = e.name === 'TokenExpiredError' ? 'Token expirado' : 'Token inválido';
    return res.status(401).json({ ok: false, error: msg });
  }
}

// Alias con nombre (named export) para quien prefiera llamarlo así
export const authRequired = requireAuth;
