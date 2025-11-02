import { Router } from "express";
import { enviarCorreo, verificarSMTP } from "../../services/servicio_Correo.js";
import db from "../../config/db.js";

const r = Router();

/** Health SMTP */
r.get("/dev/health/mail", async (_req, res) => {
  const h = await verificarSMTP();
  res.json(h);
});

/**
 * POST /dev/mail-test
 * Body JSON:
 * { "correo_usuario": "alguien@dominio.cl" }
 * - Busca el correo en la tabla Usuario (opcional, solo para validar/existir).
 * - Si existe o no, envía al correo indicado (así sirve para cualquier correo).
 */
r.post("/dev/mail-test", async (req, res) => {
  try {
    const correo = String(req.body?.correo_usuario || "").trim();
    if (!correo) {
      return res.status(400).json({ ok: false, error: "Debes enviar 'correo_usuario'." });
    }

    // Validación opcional: ver si existe en Usuario (no bloquea el envío).
    try {
      const [rows] = await db.execute(
        `SELECT id_usuario, nombre FROM usuario WHERE correo_usuario = ? LIMIT 1`,
        [correo]
      );
      if (rows.length) {
        console.log(`[mail-test] Destinatario existe en Usuario → id=${rows[0].id_usuario}, nombre=${rows[0].nombre}`);
      } else {
        console.log(`[mail-test] Correo no existe en Usuario, se envía igual → ${correo}`);
      }
    } catch (e) {
      console.warn("[mail-test] Validación de Usuario falló (se continúa):", e?.message || e);
    }

    const base = process.env.APP_BASE_URL || "http://localhost:5173";
    const enlaceDetalle = `${base}/licencias/1`; // link dummy de prueba

    const subject = `Prueba de notificación MedLeave`;
    const html = `
      <div style="font-family:Inter,Arial,sans-serif;line-height:1.5">
        <h2 style="margin:0 0 8px">Notificación de prueba</h2>
        <p>Este correo fue enviado a <b>${correo}</b> usando SMTP (Brevo).</p>
        <p><a href="${enlaceDetalle}" target="_blank" rel="noopener"
          style="display:inline-block;padding:10px 14px;background:#1a73e8;color:#fff;border-radius:8px;text-decoration:none">Abrir MedLeave</a></p>
        <p style="color:#6b7280;font-size:12px">Entorno DEV.</p>
      </div>`;
    const text = `Notificación de prueba a ${correo}. Ver: ${enlaceDetalle}`;

    const resp = await enviarCorreo({ to: correo, subject, html, text });
    if (!resp.ok) return res.status(500).json(resp);
    res.json(resp);
  } catch (e) {
    console.error("[/dev/mail-test] error:", e);
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

export default r;
