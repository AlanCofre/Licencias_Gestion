import crypto from 'crypto';


export function encriptarContrasena(contrasena) {
  return crypto.createHash('sha256').update(contrasena).digest('hex');
}


export function verificarContrasena(contrasena, hashGuardado) {
  const hash = crypto.createHash('sha256').update(contrasena).digest('hex');
  return hash === hashGuardado;
}
