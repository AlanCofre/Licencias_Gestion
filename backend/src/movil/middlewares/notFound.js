/**
 * Middleware que captura rutas que no existen.
 * 
 * Cuando alguien intenta acceder a una ruta que no está definida
 * en tu aplicación, este middleware responde con un error 404.
 */
const notFound = (req, res, next) => {
  const error = new Error(`Ruta no encontrada: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

export default notFound;