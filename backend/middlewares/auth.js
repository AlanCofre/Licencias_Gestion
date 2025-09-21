import jwt from 'jsonwebtoken';

// Middleware base: valida el token y mete datos en req
export const validarJWT = (req, res, next) => {
  // Puedes aceptar token en headers o query
  const token =
    req.header('Authorization')?.replace('Bearer ', '') ||
    req.header('x-token') ||
    req.query.token;

  if (!token) {
    return res.status(401).json({
      msg: 'No hay token en la petición',
    });
  }

  try {
    const { id, rol } = jwt.verify(token, process.env.JWT_SECRET);
    req.id = id;
    req.rol = rol;
    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({
      msg: 'Token no válido',
    });
  }
};

// Middleware específico: SOLO estudiante
export const esEstudiante = (req, res, next) => {
  if (!req.rol) {
    return res.status(500).json({
      msg: 'Primero valida el token antes de verificar roles',
    });
  }

  if (req.rol !== 'estudiante') {
    return res.status(403).json({
      msg: 'No tiene permisos para realizar esta acción (solo estudiantes)',
    });
  }

  next();
};

// Middleware genérico: permite varios roles
export const tieneRol = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.rol) {
      return res.status(500).json({
        msg: 'Primero valida el token antes de verificar roles',
      });
    }

    if (!rolesPermitidos.includes(req.rol)) {
      return res.status(403).json({
        msg: `Requiere uno de estos roles: ${rolesPermitidos}`,
      });
    }

    next();
  };
};
