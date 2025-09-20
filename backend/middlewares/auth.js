import jwt from 'jsonwebtoken';

export const validarJWT = (req, res, next) => {
  const token = req.query.token || req.header('x-token');

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
    console.log(error);
    res.status(401).json({
      msg: 'Token no válido',
    });
  }
};

export const esEstudiante = (req, res, next) => {
  if (!req.rol) {
    return res.status(500).json({
      msg: 'Se quiere verificar el role sin validar el token primero',
    });
  }

  if (req.rol !== 'estudiante') {
    return res.status(403).json({
      msg: 'No tiene permisos para realizar esta acción',
    });
  }

  next();
};
