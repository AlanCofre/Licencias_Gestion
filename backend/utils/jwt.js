import jwt from 'jsonwebtoken';

export const generarJWT = (id, rol) => {
  return new Promise((resolve, reject) => {
    const payload = { id, rol };
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      {
        expiresIn: '1h',
      },
      (err, token) => {
        if (err) {
          console.log(err);
          reject('No se pudo generar el token');
        }
        resolve(token);
      }
    );
  });
};
