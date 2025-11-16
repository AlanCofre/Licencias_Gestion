// =======================================================
// servicio_Correo.js — versión limpia con 1 log por proceso
// =======================================================

import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

/* =======================
   Configuración SMTP BREVO
   ======================= */
const host = process.env.MAIL_HOST || "smtp-relay.brevo.com";
const port = Number(process.env.MAIL_PORT || "587");
const user = process.env.MAIL_USER || "";
const pass = process.env.MAIL_PASS || "";
const fromDom = process.env.MAIL_DOM || "medleave8@gmail.com";

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: false,
  auth: { user, pass },
  authMethod: "LOGIN",
  requireTLS: true,
  tls: { rejectUnauthorized: false },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
  pool: true,
  maxConnections: 5,
  maxMessages: 50,
});

/* =======================
   Healthcheck SMTP
   ======================= */
export async function verificarSMTP() {
  try {
    await transporter.verify();
    console.log(`[Correo] SMTP verificado correctamente.`);
    return { ok: true };
  } catch (err) {
    console.error(`[Correo] Error verificando SMTP: ${err.message}`);
    return { ok: false, error: err.message };
  }
}

/* =======================
   Envío genérico
   ======================= */
export async function enviarCorreo({ to, subject, html, text, headers = {} }) {
  const from = `"Medmanager" <${fromDom}>`;

  const finalHeaders = {
    ...headers,
    "X-Mailer": "MedLeave-API",
  };

  try {
    await transporter.sendMail({
      from,
      to,
      subject,
      html,
      text,
      headers: finalHeaders,
    });

    // 🔥 LOG FINAL ÚNICO
    console.log(`[Correo] Envío OK → ${subject}`);
    return { ok: true };
  } catch (err) {
    // 🔥 LOG FINAL ÚNICO DE ERROR
    console.error(`[Correo] Error enviando ${subject}: ${err.message}`);
    return { ok: false, error: err.message };
  }
}

/* =======================
   Utilidades destinatarios
   ======================= */
export function getSecretariaToList() {
  const raw = process.env.SECRETARIA_EMAILS || "";
  return raw.split(",").map(s => s.trim()).filter(Boolean);
}

export async function getFuncionariosCorreos() {
  try {
    const db = (await import("../config/db.js")).default;

    const [rows] = await db.execute(
      `SELECT u.correo_usuario
         FROM usuario u
         JOIN rol r ON u.id_rol = r.id_rol
        WHERE r.nombre_rol = 'funcionario' AND u.activo = 1`
    );

    return rows.map(r => r.correo_usuario).filter(Boolean);
  } catch (_) {
    return getSecretariaToList();
  }
}

/* ===========================================================
   Recuperación de contraseña
   =========================================================== */
export async function enviarCodigoRecuperacion(to, code) {
  const subject = "Código para restablecer tu contraseña";

  const html = `
    <div style="font-family:sans-serif">
      <h2>Restablecimiento de contraseña</h2>
      <p>Tu código es:</p>
      <h3>${code}</h3>
    </div>`;

  const text = `Tu código de verificación es ${code}.`;

  return enviarCorreo({ to, subject, html, text });
}

/* ===========================================================
   Notificación: Estado de licencia a estudiante
   =========================================================== */
export async function notificarEstadoLicenciaEstudiante({
  to,
  folio,
  estudianteNombre,
  estado,
  motivo_rechazo,
  fechaInicio,
  fechaFin,
  observacion,
  enlaceDetalle,
}) {
  if (!to) return { ok: false, error: "No destinatario" };

  const estadoTexto = estado === "aceptado" ? "APROBADA" : "RECHAZADA";
  const subject = `Licencia ${folio} · ${estadoTexto}`;

  const html = `
    <div style="font-family:Inter, sans-serif">
      <h2>Estado de tu licencia</h2>
      <p>Folio: ${folio}</p>
      <p>Estado: ${estadoTexto}</p>
    </div>`;

  const text = `Licencia ${folio} → ${estadoTexto}`;

  return enviarCorreo({ to, subject, html, text });
}

/* ===========================================================
   Notificación: Licencia creada
   =========================================================== */
export async function notificarLicenciaCreadaEstudiante({
  to,
  folio,
  estudianteNombre,
  fechaInicio,
  fechaFin,
}) {
  if (!to) return { ok: false, error: "No destinatario" };

  const subject = `Licencia ${folio} · Enviada para revisión`;

  const html = `
    <div style="font-family:Inter, sans-serif">
      <h2>Licencia en revisión</h2>
      <p>Folio: ${folio}</p>
    </div>`;

  const text = `Licencia ${folio} enviada para revisión`;

  return enviarCorreo({ to, subject, html, text });
}

/* ===========================================================
   Notificación a funcionarios: nueva licencia
   =========================================================== */
export async function notificarNuevaLicencia({
  folio,
  estudiante,
  fechaCreacionISO,
  enlaceDetalle,
  to,
}) {
  let toList = [];

  try {
    toList = Array.isArray(to) && to.length ? to : await getFuncionariosCorreos();
  } catch (_) {
    toList = getSecretariaToList();
  }

  if (!toList.length) return { ok: false, error: "Sin destinatarios" };

  const subject = `Nueva licencia recibida · Folio ${folio}`;
  const html = `<h2>Nueva licencia</h2><p>Folio: ${folio}</p>`;
  const text = `Nueva licencia folio ${folio}`;

  return enviarCorreo({ to: toList, subject, html, text });
}

/* ===========================================================
   Notificación: Cambio de estado a secretaría / admin
   =========================================================== */
export async function notificarCambioEstado({ folio, estado, observacion, enlaceDetalle, to }) {
  const lista = Array.isArray(to) && to.length ? to : getSecretariaToList();
  if (!lista.length) return { ok: false, error: "Sin destinatarios" };

  const subject = `Licencia ${folio} · Estado actualizado a ${estado}`;
  const html = `<h2>Cambio de estado</h2>`;
  const text = `Estado actualizado → ${estado}`;

  return enviarCorreo({ to: lista, subject, html, text });
}

/* ===========================================================
   Notificación a profesor: licencia aceptada
   =========================================================== */
export async function notificarLicenciaAceptadaProfesor({
  to,
  folio,
  estudianteNombre,
  nombreCurso,
  fechaInicio,
  fechaFin,
  enlaceDetalle,
}) {
  if (!to) return { ok: false, error: "No destinatario" };

  const subject = `Licencia ${folio} aceptada para ${nombreCurso}`;
  const html = `
    <div style="font-family:Inter, sans-serif">
      <h2>Licencia aceptada</h2>
      <p>Curso: ${nombreCurso}</p>
    </div>`;
  const text = `Licencia aceptada para ${nombreCurso}`;

  return enviarCorreo({ to, subject, html, text });
}
