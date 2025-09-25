// backend/src/middlewares/validarLicenciaMedica.js  (ESM unificado)
import { z } from 'zod';

/* ========== Helpers de normalización ========== */
const ESTADOS_DB = ['pendiente', 'aceptado', 'rechazado'];

function normalizaEstado(raw) {
  if (!raw) return 'pendiente';
  const v = String(raw).toLowerCase().trim().replace(/\s+/g, '_');

  // Alias → valores de BD
  const map = {
    // pendiente
    'pendiente': 'pendiente',
    'en_revision': 'pendiente',
    'en-revision': 'pendiente',
    'en revisión': 'pendiente',
    'enrev': 'pendiente',
    'espera': 'pendiente',

    // aceptado (antes "aprobada/o/aceptada")
    'aprobada': 'aceptado',
    'aprobado': 'aceptado',
    'aceptada': 'aceptado',
    'aceptado': 'aceptado',

    // rechazado (antes "rechazada")
    'rechazada': 'rechazado',
    'rechazado': 'rechazado',
  };

  const norm = map[v] || v;
  return ESTADOS_DB.includes(norm) ? norm : 'pendiente';
}

function toYYYYMMDD(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  // YYYY-MM-DD → ok
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // DD-MM-YYYY o DD/MM/YYYY → YYYY-MM-DD
  const m = s.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;

  // Último intento: Date parseable → YYYY-MM-DD
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  }
  return null;
}

/* ========== Validación LEGACY (sin Zod) ========== */
export function validarLicencia(req, res, next) {
  const { fecha_inicio, fecha_fin } = req.body || {};
  const isISO = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d);

  if (!fecha_inicio || !isISO(fecha_inicio)) {
    return res
      .status(400)
      .json({ ok: false, mensaje: 'fecha_inicio es requerida (YYYY-MM-DD)' });
  }
  if (!fecha_fin || !isISO(fecha_fin)) {
    return res
      .status(400)
      .json({ ok: false, mensaje: 'fecha_fin es requerida (YYYY-MM-DD)' });
  }
  if (new Date(fecha_inicio) > new Date(fecha_fin)) {
    return res
      .status(400)
      .json({ ok: false, mensaje: 'fecha_inicio no puede ser posterior a fecha_fin' });
  }
  return next();
}

/* ===================== Schemas Zod ===================== */
// Para DATEONLY en Sequelize es más seguro validar como string YYYY-MM-DD.
const ymdSchema = z
  .string({ required_error: 'Fecha requerida' })
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (usa YYYY-MM-DD)');

export const licenciaSchema = z
  .object({
    id_usuario: z
      .coerce.number({ invalid_type_error: 'id_usuario debe ser numérico' })
      .int()
      .positive(),
    folio: z.string().min(1, 'folio es requerido').max(50, 'folio muy largo'),
    // REQUERIDA por tu BD (NOT NULL)
    fecha_emision: ymdSchema,
    fecha_inicio: ymdSchema,
    fecha_fin: ymdSchema,
    // Estado final siempre mapeado a BD: pendiente | aceptado | rechazado
    estado: z
      .string()
      .transform((v) => normalizaEstado(v))
      .refine((v) => ESTADOS_DB.includes(v), 'estado no válido'),
    motivo_rechazo: z.string().trim().max(300).nullable().optional(),
  })
  .superRefine((data, ctx) => {
    // Comparación de strings YYYY-MM-DD → convierto a Date
    const ini = new Date(data.fecha_inicio);
    const fin = new Date(data.fecha_fin);
    if (ini > fin) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['fecha_inicio'],
        message: 'La fecha de inicio no puede ser posterior a la fecha de fin',
      });
    }
    const MS = 24 * 60 * 60 * 1000;
    const dias = Math.ceil((fin - ini) / MS) + 1;
    if (dias > 90) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['fecha_fin'],
        message: 'La licencia no puede exceder 90 días',
      });
    }
    if (data.estado === 'rechazado' && !data.motivo_rechazo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['motivo_rechazo'],
        message: 'Debe indicar un motivo de rechazo',
      });
    }
    if (data.estado !== 'rechazado' && data.motivo_rechazo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['motivo_rechazo'],
        message: 'motivo_rechazo solo se usa cuando estado = rechazado',
      });
    }
  });

export const licenseSchema = z
  .object({
    studentId: z
      .number({ invalid_type_error: 'studentId debe ser numérico' })
      .int()
      .positive(),
    tipo: z.enum(['Reposo', 'Intervención', 'Control', 'Otro']).default('Reposo'),
    motivo: z.string().min(3, 'motivo demasiado corto').max(200),
    descripcion: z.string().optional().default(''),
    fecha_inicio: ymdSchema,
    fecha_fin: ymdSchema,
    requiere_archivo: z.boolean().optional().default(true),
  })
  .superRefine((data, ctx) => {
    const ini = new Date(data.fecha_inicio);
    const fin = new Date(data.fecha_fin);
    if (ini > fin) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['fecha_inicio'],
        message: 'La fecha de inicio no puede ser posterior a la fecha de fin',
      });
    }
    const MS_DIA = 24 * 60 * 60 * 1000;
    const dias = Math.ceil((fin - ini) / MS_DIA) + 1;
    if (dias > 90) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['fecha_fin'],
        message: 'La licencia no puede exceder 90 días',
      });
    }
  });

/* ===================== Normalizador + Middlewares ===================== */
function sendZodErrors(result, res) {
  const errores = (result.error?.issues || []).map((e) => ({
    campo: (Array.isArray(e.path) && e.path.join('.')) || 'body',
    mensaje: e.message,
  }));
  return res.status(400).json({ ok: false, errores });
}

/**
 * Normaliza req.body ANTES de validar con Zod:
 * - fecha_emision/fecha_inicio/fecha_fin → YYYY-MM-DD
 * - estado → mapea a pendiente|aceptado|rechazado
 * - id_usuario → numérico (si viene de req.user lo inyecta)
 * - Si falta fecha_emision, usa fecha_inicio (cumple NOT NULL en BD)
 */
function normalizarLicenciaBody(req) {
  req.body = req.body || {};

  // id_usuario: permite inyectar desde JWT si tu middleware lo puso en req.user
  if (req.user && req.user.id_usuario && !req.body.id_usuario) {
    req.body.id_usuario = req.user.id_usuario;
  }

  // Fechas
  const fi = toYYYYMMDD(req.body.fecha_inicio);
  const ff = toYYYYMMDD(req.body.fecha_fin);
  let fe = toYYYYMMDD(req.body.fecha_emision);

  // Si BD requiere NOT NULL y no vino, usar fecha_inicio
  if (!fe && fi) fe = fi;

  req.body.fecha_inicio = fi || req.body.fecha_inicio;
  req.body.fecha_fin = ff || req.body.fecha_fin;
  req.body.fecha_emision = fe || req.body.fecha_emision;

  // Estado normalizado (si no viene, quedará 'pendiente' por transform)
  if (req.body.estado != null) {
    req.body.estado = normalizaEstado(req.body.estado);
  } else {
    req.body.estado = 'pendiente';
  }

  // id_usuario a número
  if (req.body.id_usuario != null) {
    req.body.id_usuario = Number(req.body.id_usuario);
  }
}

export function validateLicenciaBody(req, res, next) {
  normalizarLicenciaBody(req);
  const parsed = licenciaSchema.safeParse(req.body);
  if (!parsed.success) return sendZodErrors(parsed, res);
  req.validated = parsed.data;
  return next();
}

export function validateLicenseBody(req, res, next) {
  const body = { ...req.body };
  // normalizo fechas por consistencia
  body.fecha_inicio = toYYYYMMDD(body.fecha_inicio) || body.fecha_inicio;
  body.fecha_fin = toYYYYMMDD(body.fecha_fin) || body.fecha_fin;

  const result = licenseSchema.safeParse(body);
  if (!result.success) return sendZodErrors(result, res);
  req.validated = result.data;
  return next();
}

/* ===================== Exports útiles ===================== */
export const estadosPermitidos = ESTADOS_DB;

export default {
  validarLicencia,
  validateLicenciaBody,
  validateLicenseBody,
  licenciaSchema,
  licenseSchema,
  estadosPermitidos,
  normalizaEstado,
  toYYYYMMDD,
};
