// src/middlewares/validarLicencia.js
module.exports = function validarLicencia(req, res, next) {
  const { fecha_inicio, fecha_fin } = req.body || {};
  const isISO = d => /^\d{4}-\d{2}-\d{2}$/.test(d);

  if (!fecha_inicio || !isISO(fecha_inicio)) {
    return res.status(400).json({ ok: false, mensaje: 'fecha_inicio es requerida (YYYY-MM-DD)' });
  }
  if (!fecha_fin || !isISO(fecha_fin)) {
    return res.status(400).json({ ok: false, mensaje: 'fecha_fin es requerida (YYYY-MM-DD)' });
  }
  if (new Date(fecha_inicio) > new Date(fecha_fin)) {
    return res.status(400).json({ ok: false, mensaje: 'fecha_inicio no puede ser posterior a fecha_fin' });
  }
  next();
};
