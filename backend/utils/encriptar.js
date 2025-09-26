import bcrypt from 'bcryptjs';

export const encriptarContrasena = async (contrasena) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(contrasena, salt);
};

export const verificarContrasena = async (contrasena, hashGuardado) => {
  return await bcrypt.compare(contrasena, hashGuardado);
};
