// backend/services/Servicio_Correo.js
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

/* =======================
   Configuración SMTP MAIL
   ======================= */
const host = (process.env.MAIL_HOST || "").trim();
const port = Number((process.env.MAIL_PORT || "587").trim());
const user = (process.env.MAIL_USER || "").trim(); // debe ser "apikey" en Brevo
const pass = (process.env.MAIL_PASS || "").trim(); // xsmtpsib-...
const fromDom = (process.env.MAIL_DOM || "").trim(); // remitente (verificado en Brevo)

// secure: true solo si usamos 465 (TLS directo)
// requireTLS: true para 587 (STARTTLS)
const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: { user, pass },
  authMethod: "PLAIN",
  requireTLS: port !== 465,
  pool: true,
  maxConnections: 5,
  maxMessages: 50,
  tls: { rejectUnauthorized: false }, // útil en desarrollo; puedes quitarlo en prod
});

/* ==============
   Healthcheck SMTP
   ============== */
export async function verificarSMTP() {
  try {
    await transporter.verify();
    return { ok: true };
  } catch (err) {
    console.error("SMTP verify error:", err?.message || err);
    return { ok: false, error: String(err?.message || err) };
  }
}

/* ==============
   Envío genérico
   ============== */
export async function enviarCorreo({ to, subject, html, text, headers }) {
  const from = `"MedLeave Notificaciones" <${process.env.MAIL_DOM}>`;

  // si 'to' es array, usamos el primero como TO y el resto como BCC
  let toField = to, bccField;
  if (Array.isArray(to) && to.length > 1) {
    [toField, ...bccField] = to;
  }

  try {
    const info = await transporter.sendMail({ from, to: toField, bcc: bccField, subject, html, text, headers });
    console.log("📨 Correo enviado:", info.messageId, "→", Array.isArray(to) ? to.join(", ") : to);
    return { ok: true, id: info.messageId };
  } catch (error) {
    console.error("❌ Error al enviar correo:", error);
    return { ok: false, error: String(error?.message || error) };
  }
}

/* ==========================================================
   Utilidades de destinatarios (fallback por variables de entorno)
   ========================================================== */
export function getSecretariaToList() {
  const raw = process.env.SECRETARIA_EMAILS || "";
  return raw.split(",").map(s => s.trim()).filter(Boolean);
}

/* ==========================================
   Plantilla: recuperación de contraseña (opcional)
   ========================================== */
export async function enviarCodigoRecuperacion(to, code) {
  const subject = "Código para restablecer tu contraseña";
  const html = `
    <div style="font-family:sans-serif">
      <h2>Restablecimiento de contraseña</h2>
      <p>Tu código de verificación es:</p>
      <h3 style="color:#1a73e8">${code}</h3>
      <p>Este código expirará en 10 minutos.</p>
    </div>`;
  const text = `Tu código de verificación es: ${code} (expira en 10 minutos).`;
  return enviarCorreo({ to, subject, html, text });
}

/* ==========================================================
   NUEVA LICENCIA: correo a secretaría/funcionarios
   - Soporta `to` (array o string). Si no viene, usa SECRETARIA_EMAILS.
   ========================================================== */
export async function notificarNuevaLicencia({
  folio,
  estudiante,
  fechaCreacionISO,
  enlaceDetalle,
  to, // ← opcional: lista dinámica desde el controlador
}) {
  const toList = Array.isArray(to) && to.length
    ? to
    : getSecretariaToList();

  if (!toList.length) {
    return { ok: false, error: "No hay destinatarios configurados (ni to[] ni SECRETARIA_EMAILS)" };
  }

  const subject = `Nueva licencia recibida · Folio ${folio}`;
  const fechaFmt = new Date(fechaCreacionISO).toLocaleString("es-CL", { hour12: false });
  const html = `
    <div style="font-family:Inter,Arial,sans-serif;line-height:1.5">
      <h2 style="margin:0 0 8px">Nueva licencia pendiente</h2>
      <p style="margin:0 0 12px">Se ha recibido una nueva licencia para revisión.</p>
      <ul style="padding-left:16px">
        <li><b>Folio:</b> ${folio}</li>
        <li><b>Estudiante:</b> ${estudiante?.nombre || "—"}</li>
        <li><b>Correo:</b> ${estudiante?.correo || "—"}</li>
        <li><b>Fecha creación:</b> ${fechaFmt}</li>
      </ul>
      <p><a href="${enlaceDetalle}" target="_blank" rel="noopener" 
        style="display:inline-block;padding:10px 14px;background:#1a73e8;color:#fff;
        text-decoration:none;border-radius:8px">Abrir en MedLeave</a></p>
      <p style="color:#6b7280;font-size:12px">Este es un correo automático. No responder.</p>
    </div>`;
  const text = `Nueva licencia pendiente.
Folio: ${folio}
Estudiante: ${estudiante?.nombre || "—"} (${estudiante?.correo || "—"})
Fecha creación: ${fechaFmt}
Ver: ${enlaceDetalle}`;

  return enviarCorreo({ to: toList, subject, html, text });
}

/* ==========================================================
   (Opcional) Cambio de estado — se deja disponible por si luego se requiere.
   No se usa actualmente, pero no estorba tenerlo listo.
   ========================================================== */
export async function notificarCambioEstado({ folio, estado, observacion, enlaceDetalle, to }) {
  const toList = Array.isArray(to) && to.length ? to : getSecretariaToList();
  if (!toList.length) return { ok: false, error: "No hay destinatarios configurados (ni to[] ni SECRETARIA_EMAILS)" };

  const subject = `Licencia ${folio} · Estado actualizado a ${estado}`;
  const html = `
    <div style="font-family:Inter,Arial,sans-serif;line-height:1.5">
      <h2 style="margin:0 0 8px">Estado actualizado</h2>
      <p style="margin:0 0 12px">La licencia con folio <b>${folio}</b> cambió a <b>${estado}</b>.</p>
      ${observacion ? `<p><b>Observación:</b> ${observacion}</p>` : ""}
      <p><a href="${enlaceDetalle}" target="_blank" rel="noopener"
        style="display:inline-block;padding:10px 14px;background:#1a73e8;color:#fff;
        text-decoration:none;border-radius:8px">Ver detalle</a></p>
      <p style="color:#6b7280;font-size:12px">Este es un correo automático. No responder.</p>
    </div>`;
  const text = `Licencia ${folio} actualizada a ${estado}.
${observacion ? `Observación: ${observacion}\n` : ""}Ver: ${enlaceDetalle}`;

  return enviarCorreo({ to: toList, subject, html, text });
}
