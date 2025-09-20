import jwt from 'jsonwebtoken';

/**
 * Middleware para verificar el token JWT.
 * Si el token es válido, añade la información del usuario (payload) a `req.usuario`.
 * Si no, devuelve un error de autenticación.
 */
export function verificarToken(req, res, next) {
  // Buscar el token en la cabecera 'Authorization'
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Formato "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. No se proporcionó un token.' });
  }

  // Verificar el token
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Token no válido o expirado.' });
    }
    // Si el token es válido, guardamos el payload en el request para uso posterior
    req.usuario = decoded;
    next(); // Continuar con la siguiente ruta o middleware
  });
}

/**
 * Middleware para verificar si el usuario tiene rol de administrador.
 * Se debe usar *después* de verificarToken.
 * Asumimos que el rol de 'admin' corresponde a id_rol = 3.
 */
export function esAdmin(req, res, next) {
  if (!req.usuario) {
    return res.status(500).json({ error: 'Error de autenticación interna.' });
  }

  const { rol } = req.usuario;

  // Asumimos que el rol de 'admin' es 3. Esto debería venir de la base de datos en un futuro.
  if (rol !== 3) {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador.' });
  }

  next(); // El usuario es admin, continuar
}
