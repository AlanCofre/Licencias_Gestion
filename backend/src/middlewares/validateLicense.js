// npm i zod
const { z } = require('zod');

// Util: normaliza y valida fechas (acepta 'YYYY-MM-DD' o ISO)
const dateSchema = z.coerce.date({ invalid_type_error: "Fecha inválida" });

const licenseSchema = z.object({
  // Ajusta los nombres según tu frontend
  studentId: z.number({ invalid_type_error: "studentId debe ser numérico" })
              .int().positive(),
  tipo: z.enum(["Reposo", "Intervención", "Control", "Otro"]).default("Reposo"),
  motivo: z.string().min(3, "motivo demasiado corto").max(200),
  descripcion: z.string().optional().default(""),
  fecha_inicio: dateSchema,
  fecha_fin: dateSchema,
  // opcional si permites crear sin archivo
  requiere_archivo: z.boolean().optional().default(true),
}).superRefine((data, ctx) => {
  if (data.fecha_inicio > data.fecha_fin) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "La fecha de inicio no puede ser posterior a la fecha de fin",
      path: ["fecha_inicio"]
    });
  }
  // (Opcional) límite de duración, p.ej. 90 días
  const MS_DIA = 24*60*60*1000;
  const dias = Math.ceil((data.fecha_fin - data.fecha_inicio)/MS_DIA) + 1;
  if (dias > 90) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "La licencia no puede exceder 90 días",
      path: ["fecha_fin"]
    });
  }
});

function validateLicenseBody(req, res, next) {
  const result = licenseSchema.safeParse(req.body);
  if (!result.success) {
    const errores = result.error.errors.map(e => ({
      campo: e.path.join(".") || "body",
      mensaje: e.message
    }));
    return res.status(400).json({ ok:false, errores });
  }
  // reemplaza body normalizado (fechas como Date, defaults, etc.)
  req.validated = result.data;
  next();
}

module.exports = { validateLicenseBody };
