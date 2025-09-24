
export function validarNombre(nombre) {
  const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,}$/;
  return regex.test(nombre);
}

export function validarCorreo(correo) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(correo);
}

export function validarContrasena(contrasena) {
  return contrasena && contrasena.length >= 6;
}
