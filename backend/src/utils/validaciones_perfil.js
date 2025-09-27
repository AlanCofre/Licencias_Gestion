const REG_TEL = /^[+()\-\s\d]{6,20}$/;

export function validarPerfilPayload(body = {}) {
  const errores = [];
  const out = {};

  if (body.correo_alt != null && body.correo_alt !== '') {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.correo_alt)) errores.push('correo_alt inválido');
    else out.correo_alt = String(body.correo_alt).trim();
  } else out.correo_alt = null;

  if (body.telefono != null && body.telefono !== '') {
    if (!REG_TEL.test(body.telefono)) errores.push('telefono inválido');
    else out.telefono = String(body.telefono).trim();
  } else out.telefono = null;

  out.direccion = body.direccion ? String(body.direccion).trim().slice(0, 255) : null;

  if (body.foto_url != null && body.foto_url !== '') {
    try { new URL(body.foto_url); out.foto_url = body.foto_url; }
    catch { errores.push('foto_url inválida'); }
  } else out.foto_url = null;

  return { valido: errores.length === 0, errores, data: out };
}
