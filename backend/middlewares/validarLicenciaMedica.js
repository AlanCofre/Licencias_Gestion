// backend/src/middlewares/validarLicencia.js  (ESM unificado)
import { z } from 'zod';

/* ========== Validación LEGACY (fecha_inicio / fecha_fin en 'YYYY-MM-DD') ========= */
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

/* ===================== Schemas Zod compartidos ===================== */
const dateSchema = z.coerce.date({ invalid_type_error: 'Fecha inválida' });

/* ===== Licencia Médica ===== */
export const estadosPermitidos = ['Pendiente', 'En revisión', 'Aprobada', 'Rechazada'];

export const licenciaSchema = z
  .object({
    id_usuario: z
      .coerce.number({ invalid_type_error: 'id_usuario debe ser numérico' })
      .int()
      .positive(),
    folio: z.string().min(1, 'folio es requerido').max(50, 'folio muy largo'),
    // Si tu folio debe ser solo dígitos, descomenta:
    // .regex(/^\d+$/, 'folio debe contener solo dígitos'),
    fecha_emision: dateSchema.optional(),
    fecha_inicio: dateSchema,
    fecha_fin: dateSchema,
    estado: z
      .string()
      .default('Pendiente')
      .refine((v) => estadosPermitidos.includes(v), 'estado no válido'),
    motivo_rechazo: z.string().trim().max(300).nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.fecha_inicio > data.fecha_fin) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['fecha_inicio'],
        message: 'La fecha de inicio no puede ser posterior a la fecha de fin',
      });
    }
    const MS = 24 * 60 * 60 * 1000;
    const dias = Math.ceil((data.fecha_fin - data.fecha_inicio) / MS) + 1;
    if (dias > 90) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['fecha_fin'],
        message: 'La licencia no puede exceder 90 días',
      });
    }
    if (data.estado === 'Rechazada' && !data.motivo_rechazo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['motivo_rechazo'],
        message: 'Debe indicar un motivo de rechazo',
      });
    }
    if (data.estado !== 'Rechazada' && data.motivo_rechazo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['motivo_rechazo'],
        message: 'motivo_rechazo solo se usa cuando estado = Rechazada',
      });
    }
  });

/* ===== License (versión “studentId / tipo / motivo…”) ===== */
export const licenseSchema = z
  .object({
    studentId: z
      .number({ invalid_type_error: 'studentId debe ser numérico' })
      .int()
      .positive(),
    tipo: z.enum(['Reposo', 'Intervención', 'Control', 'Otro']).default('Reposo'),
    motivo: z.string().min(3, 'motivo demasiado corto').max(200),
    descripcion: z.string().optional().default(''),
    fecha_inicio: dateSchema,
    fecha_fin: dateSchema,
    requiere_archivo: z.boolean().optional().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.fecha_inicio > data.fecha_fin) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['fecha_inicio'],
        message: 'La fecha de inicio no puede ser posterior a la fecha de fin',
      });
    }
    const MS_DIA = 24 * 60 * 60 * 1000;
    const dias = Math.ceil((data.fecha_fin - data.fecha_inicio) / MS_DIA) + 1;
    if (dias > 90) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['fecha_fin'],
        message: 'La licencia no puede exceder 90 días',
      });
    }
  });

/* ===================== Middlewares Zod ===================== */
function sendZodErrors(result, res) {
  const errores = (result.error?.issues || []).map((e) => ({
    campo: (Array.isArray(e.path) && e.path.join('.')) || 'body',
    mensaje: e.message,
  }));
  return res.status(400).json({ ok: false, errores });
}

export function validateLicenciaBody(req, res, next) {
  const parsed = licenciaSchema.safeParse(req.body);
  if (!parsed.success) return sendZodErrors(parsed, res);
  req.validated = parsed.data; // normalizado (fechas como Date, defaults, etc.)
  return next();
}

export function validateLicenseBody(req, res, next) {
  const result = licenseSchema.safeParse(req.body);
  if (!result.success) return sendZodErrors(result, res);
  req.validated = result.data;
  return next();
}

/* ===================== Export default (opcional) ===================== */
export default {
  validarLicencia,
  validateLicenciaBody,
  validateLicenseBody,
  licenciaSchema,
  licenseSchema,
  estadosPermitidos,
};
