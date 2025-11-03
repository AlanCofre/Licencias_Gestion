// backend/services/servicio_Correo.js
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

/* ================================
   📡 CONFIGURACIÓN SMTP BREVO
   ================================ */
const host = (process.env.BREVO_HOST || "smtp-relay.brevo.com").trim();
const port = Number((process.env.BREVO_PORT || "587").trim());
const user = (process.env.BREVO_USER || "apikey").trim();
const pass = (process.env.BREVO_PASS || "").trim();
const fromDom = (process.env.BREVO_DOM || "no-reply@medleave.com").trim();
const appBaseUrl = (process.env.APP_BASE_URL || "").trim();

// ✅ Configuración segura (STARTTLS)
const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,       // true solo si 465
  requireTLS: port !== 465,   // para STARTTLS (587)
  auth: { user, pass },
  authMethod: "PLAIN",
  pool: true,
  maxConnections: 5,
  maxMessages: 50,
  tls: { rejectUnauthorized: false }, // puedes desactivar en prod si tu CA es válida
});

/* ================================
   🩺 VERIFICACIÓN SMTP
   ================================ */
export async function verificarSMTP() {
  try {
    await transporter.verify();
    console.log("✅ SMTP listo y autenticado correctamente");
    return { ok: true };
  } catch (err) {
    console.error("❌ Error verificando SMTP:", err?.message || err);
    return { ok: false, error: String(err?.message || err) };
  }
}

/* ================================
   ✉️ ENVÍO GENÉRICO
   ================================ */
export async function enviarCorreo({ to, subject, html, text, headers }) {
  const from = `"MedLeave Notificaciones" <${fromDom}>`;

  let toField = to, bccField;
  if (Array.isArray(to) && to.length > 1) {
    [toField, ...bccField] = to;
  }

  try {
    const info = await transporter.sendMail({
      from,
      to: toField,
      bcc: bccField,
      subject,
      html,
      text,
      headers,
    });
    console.log("📨 Correo enviado:", info.messageId, "→", Array.isArray(to) ? to.join(", ") : to);
    return { ok: true, id: info.messageId };
  } catch (error) {
    console.error("❌ Error al enviar correo:", error);
    return { ok: false, error: String(error?.message || error) };
  }
}

/* ================================
   📧 LISTA DE SECRETARÍAS (fallback)
   ================================ */
export function getSecretariaToList() {
  const raw = process.env.SECRETARIA_EMAILS || "";
  return raw.split(",").map(s => s.trim()).filter(Boolean);
}

/* ================================
   🔐 RECUPERAR CONTRASEÑA
   ================================ */
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

/* ================================
   📬 NUEVA LICENCIA (Secretaría)
   ================================ */
export async function notificarNuevaLicencia({
  folio,
  estudiante,
  fechaCreacionISO,
  enlaceDetalle,
  to,
}) {
  const toList = Array.isArray(to) && to.length ? to : getSecretariaToList();
  if (!toList.length) return { ok: false, error: "No hay destinatarios (SECRETARIA_EMAILS vacío)" };

  const subject = `Nueva licencia recibida · Folio ${folio}`;
  const fechaFmt = new Date(fechaCreacionISO).toLocaleString("es-CL", { hour12: false });

  const html = `
    <div style="font-family:Inter,Arial,sans-serif">
      <h2>Nueva licencia pendiente</h2>
      <p>Se ha recibido una nueva licencia para revisión.</p>
      <ul>
        <li><b>Folio:</b> ${folio}</li>
        <li><b>Estudiante:</b> ${estudiante?.nombre || "—"}</li>
        <li><b>Correo:</b> ${estudiante?.correo || "—"}</li>
        <li><b>Fecha creación:</b> ${fechaFmt}</li>
      </ul>
      <p><a href="${enlaceDetalle}" style="display:inline-block;padding:10px 14px;background:#1a73e8;color:#fff;text-decoration:none;border-radius:6px">Abrir en MedLeave</a></p>
      <p style="color:#6b7280;font-size:12px">Correo automático, no responder.</p>
    </div>`;
  const text = `Nueva licencia pendiente.
Folio: ${folio}
Estudiante: ${estudiante?.nombre || "—"} (${estudiante?.correo || "—"})
Fecha: ${fechaFmt}
Ver: ${enlaceDetalle}`;

  return enviarCorreo({ to: toList, subject, html, text });
}

/* ================================
   🧍‍♀️ NOTIFICACIONES AL ESTUDIANTE
   ================================ */
function renderDetalleLicencia(licencia = {}) {
  return `
    <ul style="padding-left:16px">
      <li><b>Folio:</b> ${licencia.folio || licencia.id_licencia || "—"}</li>
      ${licencia.estado ? `<li><b>Estado:</b> ${licencia.estado}</li>` : ""}
      ${licencia.observacion ? `<li><b>Observación:</b> ${licencia.observacion}</li>` : ""}
    </ul>`;
}

/* === Enviada === */
export async function notificarEstudianteLicenciaEnviada({ to, nombre, licencia = {} }) {
  if (!to) return { ok: false, error: "Correo del estudiante vacío" };
  const subject = "Hemos recibido tu licencia médica";
  const enlace = appBaseUrl ? `${appBaseUrl}/licencias/mis-licencias` : "#";
  const html = `
    <div style="font-family:Inter,Arial,sans-serif">
      <h2>Licencia recibida ✅</h2>
      <p>Hola ${nombre || "estudiante"}, tu licencia fue <b>recibida</b> y está en proceso de revisión.</p>
      ${renderDetalleLicencia(licencia)}
      <p><a href="${enlace}" style="display:inline-block;padding:10px 14px;background:#1a73e8;color:#fff;text-decoration:none;border-radius:6px">Ver mis licencias</a></p>
      <p style="color:#6b7280;font-size:12px">Correo automático, no responder.</p>
    </div>`;
  const text = `Tu licencia fue recibida. Estado: ${licencia.estado || "pendiente"}.`;
  return enviarCorreo({ to, subject, html, text });
}

/* === Aceptada === */
export async function notificarEstudianteLicenciaAceptada({ to, nombre, licencia = {} }) {
  if (!to) return { ok: false, error: "Correo del estudiante vacío" };
  const subject = "Tu licencia médica fue ACEPTADA";
  const enlace = appBaseUrl ? `${appBaseUrl}/licencias/mis-licencias` : "#";
  const html = `
    <div style="font-family:Inter,Arial,sans-serif">
      <h2>Licencia ACEPTADA 🎉</h2>
      <p>Hola ${nombre || "estudiante"}, te informamos que tu licencia médica fue <b>aceptada</b>.</p>
      ${renderDetalleLicencia(licencia)}
      <p><a href="${enlace}" style="display:inline-block;padding:10px 14px;background:#22c55e;color:#fff;text-decoration:none;border-radius:6px">Ver en plataforma</a></p>
      <p style="color:#6b7280;font-size:12px">Correo automático, no responder.</p>
    </div>`;
  const text = `Tu licencia fue aceptada. Folio: ${licencia.folio || licencia.id_licencia || "—"}.`;
  return enviarCorreo({ to, subject, html, text });
}

/* === Rechazada === */
export async function notificarEstudianteLicenciaRechazada({ to, nombre, licencia = {} }) {
  if (!to) return { ok: false, error: "Correo del estudiante vacío" };
  const subject = "Tu licencia médica fue RECHAZADA";
  const enlace = appBaseUrl ? `${appBaseUrl}/licencias/mis-licencias` : "#";
  const html = `
    <div style="font-family:Inter,Arial,sans-serif">
      <h2>Licencia RECHAZADA ❗</h2>
      <p>Hola ${nombre || "estudiante"}, lamentamos informarte que tu licencia fue <b>rechazada</b>.</p>
      ${renderDetalleLicencia(licencia)}
      <p>Si corresponde, comunícate con Secretaría.</p>
      <p><a href="${enlace}" style="display:inline-block;padding:10px 14px;background:#ef4444;color:#fff;text-decoration:none;border-radius:6px">Ir a mis licencias</a></p>
      <p style="color:#6b7280;font-size:12px">Correo automático, no responder.</p>
    </div>`;
  const text = `Tu licencia fue rechazada.${licencia.observacion ? " Motivo: " + licencia.observacion : ""}`;
  return enviarCorreo({ to, subject, html, text });
}
