import jwt from 'jsonwebtoken';

export const generarJWT = (id, rolInput) => {
  const alias = { profesor: 'funcionario', secretario: 'funcionario', secretaria: 'funcionario', alumno: 'estudiante' };
  const rol =
    typeof rolInput === 'number'
      ? (rolInput === 1 ? 'funcionario' : rolInput === 2 ? 'estudiante' : 'estudiante')
      : (alias[String(rolInput || '').toLowerCase()] ||
         String(rolInput || '').toLowerCase() ||
         'estudiante');

  return new Promise((resolve, reject) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) return reject(new Error('JWT_SECRET no definido'));
    jwt.sign({ id, rol }, secret, { expiresIn: process.env.JWT_EXPIRES_IN || '1h' },
      (err, token) => (err ? reject(err) : resolve(token)));
  });
};
