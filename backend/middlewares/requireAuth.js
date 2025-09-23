// backend/src/middlewares/requireAuth.js  (ESM)
import jwt from 'jsonwebtoken';

export default async function requireAuth(req, res, next) {
  try {
    const hdr = req.headers.authorization || '';
    const [type, token] = hdr.split(' ');

    if (type !== 'Bearer' || !token) {
      return res.status(401).json({ ok: false, mensaje: 'Token requerido' });
    }

    // Verificar token con la clave secreta del .env
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');

    // Ajusta según los datos que guardes en tu token
    req.user = {
      id_usuario: payload.id_usuario ?? payload.id ?? 0,
      rol: payload.rol ?? 'Estudiante'
    };

    return next();
  } catch (e) {
    const msg = e.name === 'TokenExpiredError' ? 'Token expirado' : 'Token inválido';
    return res.status(401).json({ ok: false, mensaje: msg });
  }
}

// (Opcional) alias con nombre para compatibilidad
export const authRequired = requireAuth;
