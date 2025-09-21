// npm i zod
const { z } = require("zod");

// Convierte string → Date y valida (requiere zod >= 3.22)
const dateSchema = z.coerce.date({ invalid_type_error: "Fecha inválida" });

const estadosPermitidos = ["Pendiente", "En revisión", "Aprobada", "Rechazada"];

// 👈 nombre CONSISTENTE: licenciaSchema (singular)
const licenciaSchema = z.object({
  id_usuario: z.coerce.number({ invalid_type_error: "id_usuario debe ser numérico" }).int().positive(),
  folio: z.string().min(1, "folio es requerido").max(50, "folio muy largo"),
  // .regex(/^\d+$/, "folio debe contener solo dígitos"), // si tu folio es numérico puro, descomenta
  fecha_emision: dateSchema.optional(), // si no siempre viene
  fecha_inicio: dateSchema,
  fecha_fin: dateSchema,
  estado: z.string().default("Pendiente").refine(v => estadosPermitidos.includes(v), "estado no válido"),
  motivo_rechazo: z.string().trim().max(300).nullable().optional(),
}).superRefine((data, ctx) => {
  if (data.fecha_inicio > data.fecha_fin) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["fecha_inicio"],
      message: "La fecha de inicio no puede ser posterior a la fecha de fin",
    });
  }
  const MS = 24 * 60 * 60 * 1000;
  const dias = Math.ceil((data.fecha_fin - data.fecha_inicio) / MS) + 1;
  if (dias > 90) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["fecha_fin"],
      message: "La licencia no puede exceder 90 días",
    });
  }
  if (data.estado === "Rechazada" && !data.motivo_rechazo) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["motivo_rechazo"],
      message: "Debe indicar un motivo de rechazo",
    });
  }
  if (data.estado !== "Rechazada" && data.motivo_rechazo) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["motivo_rechazo"],
      message: "motivo_rechazo solo se usa cuando estado = Rechazada",
    });
  }
});

function validateLicenciaBody(req, res, next) {
  const parsed = licenciaSchema.safeParse(req.body);

  if (!parsed.success) {
    // En Zod, la lista viene en "issues"
    const list = parsed.error?.issues || parsed.error?.errors || [];
    const errores = issues.map(e => ({
      campo: (e.path && e.path.join(".")) || "body",
      mensaje: e.message
    }));

    return res.status(400).json({ ok: false, errores });
  }

  req.validated = parsed.data;
  next();
}

module.exports = { validateLicenciaBody, estadosPermitidos, licenciaSchema };
