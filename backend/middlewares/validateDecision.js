// src/middlewares/validateDecision.js
const MAP_ESTADOS = {
  aceptado: 'aceptado',
  aprobada: 'aceptado',
  aceptada: 'aceptado',
  aprobado: 'aceptado',
  rechazada: 'rechazado',
  rechazado: 'rechazado'
};

function normText(x) {
  return String(x ?? "").replace(/\s+/g, " ").trim();
}

function toISODate(d) {
  const s = normText(d);
  if (!s) return null;
  const onlyDate = s.split("T")[0];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(onlyDate)) return null;
  const dt = new Date(onlyDate);
  return isNaN(dt) ? null : onlyDate; // devolvemos YYYY-MM-DD
}

export function validateDecision(req, res, next) {
  try {
    const body = req.body || {};

    // Soporta 'estado' o 'decision' desde el cliente
    const crudo = normText(body.estado ?? body.decision);
    if (!crudo) {
      return res.status(400).json({ ok: false, error: "Debe indicar un estado/decision (aceptado|rechazado)" });
    }

    const normalizado = MAP_ESTADOS[crudo.toLowerCase()];
    if (!normalizado) {
      return res.status(400).json({ ok: false, error: "Estado/decision inválido, use aceptado|rechazado" });
    }

    // Reglas por decisión
    if (normalizado === "rechazado") {
      const motivo = normText(body.motivo_rechazo);
      if (motivo.length < 10) {
        return res.status(422).json({ ok: false, error: "motivo_rechazo es obligatorio (≥10 caracteres)" });
      }
      req.body.motivo_rechazo = motivo; // sanitizado
    }

    if (normalizado === "aceptado") {
      const fiIn = body.correcciones?.fecha_inicio ?? body.fecha_inicio;
      const ffIn = body.correcciones?.fecha_fin ?? body.fecha_fin;

      const fi = toISODate(fiIn);
      const ff = toISODate(ffIn);

      if (!fi || !ff) {
        return res.status(422).json({ ok: false, error: "Para aceptar debes incluir fecha_inicio y fecha_fin (YYYY-MM-DD)" });
      }
      if (new Date(fi) > new Date(ff)) {
        return res.status(422).json({ ok: false, error: "fecha_inicio no puede ser mayor a fecha_fin" });
      }

      // Pasar fechas ya normalizadas al service
      req.body._fi = fi;
      req.body._ff = ff;
    }

    // Dejar ambos campos normalizados para compatibilidad
    req.body.estado = normalizado;   // 'aceptado' | 'rechazado'
    req.body.decision = normalizado; // idem, por si el service espera 'decision'

    next();
  } catch (e) {
    next(e);
  }
}
