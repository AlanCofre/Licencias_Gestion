// src/middlewares/validateDecision.js

// Mapeo para normalizar valores que puedan venir en el body
const MAP_ESTADOS = {
  aceptado: 'aceptado',
  aprobada: 'aceptado',
  aceptada: 'aceptado',
  aprobado: 'aceptado',
  rechazada: 'rechazado',
  rechazado: 'rechazado'
};

export function validateDecision(req, res, next) {
  let { estado, observacion } = req.body || {};
  if (!estado) {
    return res.status(400).json({ ok:false, error:'Debe indicar un estado (aceptado|rechazado)' });
  }
  const normalizado = MAP_ESTADOS[String(estado).toLowerCase().trim()];
  if (!normalizado) {
    return res.status(400).json({ ok:false, error:'Estado inválido, use aceptado|rechazado' });
  }
  if (normalizado === 'rechazado' && !observacion?.trim()) {
    return res.status(400).json({ ok:false, error:'Debe incluir observación al rechazar' });
  }
  req.body.estado = normalizado; // 'aceptado' | 'rechazado'
  next();
}