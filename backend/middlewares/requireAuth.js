// src/middlewares/requireAuth.js
import jwt from 'jsonwebtoken';

/**
 * Middleware de autenticación (solo header Authorization)
 * - Extrae y verifica el JWT del encabezado Authorization: Bearer <token>
 * - Valida con process.env.JWT_SECRET
 * - Expone req.user con { id_usuario, role?, email? }
 */
export default function requireAuth(req, res, next) {
  try {
    // 1) Extraer token desde el header Authorization
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ ok: false, error: 'No autorizado: falta token Bearer' });
    }

    const token = authHeader.slice(7).trim(); // quita "Bearer "
    if (!token) {
      return res.status(401).json({ ok: false, error: 'No autorizado: token vacío' });
    }

    // 2) Verificar el token con la clave secreta
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('[requireAuth] JWT_SECRET no definido en .env');
      return res.status(500).json({ ok: false, error: 'Configuración faltante (JWT_SECRET)' });
    }

    const payload = jwt.verify(token, secret);

    // 3) Normalizar la información del usuario
    const id_usuario =
      payload.id_usuario ?? payload.id ?? payload.userId ?? payload.uid;

    if (!id_usuario) {
      return res.status(401).json({ ok: false, error: 'Token inválido: sin id_usuario' });
    }

    req.user = {
      id_usuario,
      role: payload.role ?? payload.rol ?? null,
      email: payload.email ?? null,
      ...payload,
    };

    // 4) Continuar hacia el siguiente middleware/controlador
    next();
  } catch (err) {
    console.error('[requireAuth]', err.message);
    return res.status(401).json({ ok: false, error: 'Token inválido o expirado' });
  }
}

export const authRequired = requireAuth;