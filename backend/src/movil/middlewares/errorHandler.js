/**
 * Middleware simple para manejar todos los errores de la aplicación.
 * 
 * Este middleware captura cualquier error que ocurra en tu aplicación
 * y envía una respuesta consistente al cliente. Express sabe que este
 * es un manejador de errores porque tiene 4 parámetros en lugar de 3.
 */
const errorHandler = (err, req, res, next) => {
  // Si el error ya tiene un código de estado, lo usamos. Si no, usamos 500
  const statusCode = err.statusCode || 500;
  
  // Construimos la respuesta de error
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Ocurrió un error en el servidor',
    // Solo mostramos el stack trace en desarrollo para ayudarnos a debuggear
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

export default errorHandler;