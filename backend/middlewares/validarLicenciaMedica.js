// backend/src/middlewares/validarLicenciaMedica.js  (ESM, unificado)
import { z } from 'zod';

/* ============================================================
   Estados permitidos en BD y utilidades de normalización
   ============================================================ */
const ESTADOS_DB = ['pendiente', 'aceptado', 'rechazado'];

export const ESTADOS = Object.freeze({
  PENDIENTE: 'pendiente',
  ACEPTADO: 'aceptado',
  RECHAZADO: 'rechazado',
});

export const estadosPermitidos = ESTADOS_DB;

export function normalizaEstado(raw) {
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
    // aceptado
    'aprobada': 'aceptado',
    'aprobado': 'aceptado',
    'aceptada': 'aceptado',
    'aceptado': 'aceptado',
    // rechazado
    'rechazada': 'rechazado',
    'rechazado': 'rechazado',
  };

  const norm = map[v] || v;
  return ESTADOS_DB.includes(norm) ? norm : 'pendiente';
}

export function toYYYYMMDD(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // DD-MM-YYYY o DD/MM/YYYY → YYYY-MM-DD
  const m = s.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;

  // Date parseable → YYYY-MM-DD
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  }
  return null;
}

/* ============================================================
   Validación LEGACY (sin Zod) — útil para endpoints antiguos
   ============================================================ */
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

/* ============================================================
   Schemas Zod (validación fuerte y mensajes claros)
   ============================================================ */
// Para DATEONLY en Sequelize es más seguro validar como string YYYY-MM-DD.
const ymdSchema = z
  .string({ required_error: 'Fecha requerida' })
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (usa YYYY-MM-DD)');

export const licenciaSchema = z
  .object({
    // ✅ Se inyecta desde JWT, no debe exigirse en el body
    id_usuario: z
      .number({ invalid_type_error: 'id_usuario debe ser numérico' })
      .int()
      .positive()
      .optional(),

    // ✅ Se genera en el backend, no debe validarse aquí
    folio: z.string().max(50).optional(),

    fecha_emision: ymdSchema.optional(), // ← se autocompleta si falta
    fecha_inicio: ymdSchema,
    fecha_fin: ymdSchema,

    estado: z
      .string()
      .transform((v) => normalizaEstado(v))
      .refine((v) => ESTADOS_DB.includes(v), 'estado no válido')
      .optional(), // ← se normaliza a 'pendiente' si no viene

    motivo_rechazo: z.string().trim().max(300).nullable().optional(),
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

/* ============================================================
   Helpers Zod + normalizador de body
   ============================================================ */
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

/* ============================================================
   Validación de archivo adjunto (multer) y transiciones
   ============================================================ */
const MIMES = new Set(['application/pdf', 'image/jpeg', 'image/png']);
const MAX_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * Valida archivo adjunto en creación.
 * Usa req.file (multer). Si en tu flujo aceptas URL ya subida, permite req.body.archivo_url.
 */
export function validarArchivoAdjunto(req, res, next) {
  const requiere = req.body?.requiere_archivo ?? true;
  const archivo = req.file;
  const url = req.body?.archivo_url;

  if (!requiere) return next();

  if (!archivo && !url) {
    return res.status(400).json({ ok: false, error: 'Archivo adjunto es obligatorio' });
  }
  if (archivo) {
    if (!MIMES.has(archivo.mimetype)) {
      return res.status(400).json({ ok: false, error: 'Tipo de archivo no permitido' });
    }
    if (archivo.size > MAX_BYTES) {
      return res.status(400).json({ ok: false, error: 'Archivo excede 5MB' });
    }
  }
  return next();
}

/**
 * Valida transición de estado según reglas de negocio:
 * - Estados permitidos: pendiente | aceptado | rechazado
 * - Creación: debe quedar 'pendiente' (ya lo normaliza Zod)
 * - Transiciones: pendiente→(aceptado|rechazado) ✅; otras ❌
 */
export function validarTransicionEstado(estadoActual) {
  return (req, res, next) => {
    const nuevo = normalizaEstado(req.body?.estado);

    // si no viene estado, no validamos transición
    if (!req.body || req.body.estado == null) return next();

    if (!estadosPermitidos.includes(nuevo)) {
      return res.status(400).json({ ok: false, error: 'Estado no válido' });
    }

    if (estadoActual === ESTADOS.PENDIENTE &&
        (nuevo === ESTADOS.ACEPTADO || nuevo === ESTADOS.RECHAZADO)) {
      return next(); // permitido
    }

    if (estadoActual === nuevo) {
      return next(); // sin cambios
    }

    return res.status(400).json({ ok: false, error: 'Transición de estado no permitida' });
  };
}

/* ============================================================
   Export por defecto (consolidado)
   ============================================================ */
export default {
  validarLicencia,
  validateLicenciaBody,
  validateLicenseBody,
  licenciaSchema,
  licenseSchema,
  estadosPermitidos,
  normalizaEstado,
  toYYYYMMDD,
  validarArchivoAdjunto,
  validarTransicionEstado,
  ESTADOS,
};
