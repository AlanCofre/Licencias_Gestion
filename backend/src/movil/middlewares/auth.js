import jwt from 'jsonwebtoken';

/**
 * Middleware simple de autenticación.
 * 
 * Todo lo que hace este middleware es:
 * 1. Buscar el token en el header Authorization
 * 2. Verificar que el token sea válido
 * 3. Guardar la información del usuario en req.user
 * 4. Continuar al siguiente middleware
 */
export const authenticate = (req, res, next) => {
  try {
    // Obtenemos el token del header
    const authHeader = req.headers.authorization;
    
    // Si no hay header Authorization, el usuario no está autenticado
    if (!authHeader) {
      const error = new Error('No estás autenticado. Por favor inicia sesión.');
      error.statusCode = 401;
      return next(error);
    }
    
    // El token viene en formato "Bearer token-aqui"
    // Entonces separamos por el espacio y tomamos la segunda parte
    const token = authHeader.split(' ')[1];
    
    // Verificamos que el token sea válido
    // Si no es válido, jwt.verify lanzará un error automáticamente
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // El token es válido, guardamos la info del usuario en la petición
    req.user = decoded;
    
    // Continuamos al siguiente middleware
    next();
    
  } catch (error) {
    // Si algo salió mal, enviamos un error 401
    error.message = 'Token inválido o expirado. Por favor inicia sesión nuevamente.';
    error.statusCode = 401;
    next(error);
  }
};