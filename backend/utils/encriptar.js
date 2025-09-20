import bcrypt from 'bcryptjs';

/**
 * Hashea una contraseña usando bcrypt.
 * @param {string} contrasena - La contraseña en texto plano.
 * @returns {Promise<string>} - El hash de la contraseña.
 */
export async function encriptarContrasena(contrasena) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(contrasena, salt);
}

/**
 * Verifica una contraseña en texto plano contra un hash guardado.
 * @param {string} contrasena - La contraseña en texto plano.
 * @param {string} hashGuardado - El hash que está en la base de datos.
 * @returns {Promise<boolean>} - True si la contraseña es correcta, false en caso contrario.
 */
export async function verificarContrasena(contrasena, hashGuardado) {
  return await bcrypt.compare(contrasena, hashGuardado);
}
