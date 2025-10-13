import Usuario from '../src/models/modelo_Usuario.js';
import LicenciaMedica from '../src/models/modelo_LicenciaMedica.js';
import { normalizaEstado } from './validarLicenciaMedica.js';

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

export async function validateDecision(req, res, next) {
  try {
    const idLicencia = Number(req.params.id);
    if (!idLicencia) {
      return res.status(400).json({ ok: false, error: "El campo 'id' es obligatorio." });
    }

    const licencia = await LicenciaMedica.findByPk(idLicencia);
    if (!licencia) {
      return res.status(404).json({ ok: false, error: "Licencia no encontrada" });
    }

    const body = req.body || {};
    const crudo = normText(body.estado ?? body.decision);
    if (!crudo) {
      return res.status(400).json({ ok: false, error: "Debe indicar un estado/decision (aceptado|rechazado)" });
    }

    const estado = MAP_ESTADOS[crudo.toLowerCase()];
    if (!estado) {
      return res.status(400).json({ ok: false, error: "Estado/decision inválido, use aceptado|rechazado" });
    }

    const { id_usuario, id_profesor, motivo_rechazo } = body;

    const campos = { estado, id_usuario, id_profesor };
    for (const [campo, valor] of Object.entries(campos)) {
      if (valor === undefined || valor === null || valor === '') {
        return res.status(400).json({
          ok: false,
          error: `El campo '${campo}' es obligatorio. Por favor, complétalo.`
        });
      }
    }

    if (licencia.estado !== 'pendiente') {
      return res.status(403).json({ ok: false, error: "Acción no permitida" });
    }

    const estudiante = await Usuario.findByPk(Number(id_usuario));
    if (!estudiante || estudiante.id_rol !== 2) {
      return res.status(404).json({ ok: false, error: "Estudiante no encontrado" });
    }

    const profesor = await Usuario.findByPk(Number(id_profesor));
    if (!profesor || profesor.id_rol !== 1) {
      return res.status(404).json({ ok: false, error: "Docente no encontrado" });
    }

    if (estado === 'rechazado') {
      const motivo = normText(motivo_rechazo);
      if (motivo.length < 10) {
        return res.status(422).json({ ok: false, error: "motivo_rechazo es obligatorio (≥10 caracteres)" });
      }
      req.body.motivo_rechazo = motivo;
    }

    req.body.estado = normalizaEstado(estado);
    req.body.decision = estado;
    req.licencia = licencia;

    next();
  } catch (e) {
    console.error("❌ Error en validateDecision:", e);
    return res.status(500).json({ ok: false, error: "Error interno al decidir licencia" });
  }
}
