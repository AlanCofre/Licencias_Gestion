// backend/services/servicio_Correo.js
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

// Configuración optimizada para Brevo
const transporter = nodemailer.createTransport({
  host,
  port,
  secure: false, // Brevo usa STARTTLS en puerto 587
  auth: {
    user: user,
    pass: pass
  },
  authMethod: 'LOGIN', // Brevo generalmente usa LOGIN
  requireTLS: true, // Importante para Brevo
  tls: {
    rejectUnauthorized: false // Útil en desarrollo
  },
  connectionTimeout: 10000, // 10 segundos
  greetingTimeout: 10000,
  socketTimeout: 10000,
  pool: true,
  maxConnections: 5,
  maxMessages: 50
});

/* ==============
   Healthcheck SMTP
   ============== */
export async function verificarSMTP() {
  try {
    await transporter.verify();
    console.log('✅ SMTP Brevo configurado correctamente');
    return { ok: true, provider: 'brevo' };
  } catch (err) {
    console.error("❌ SMTP Brevo verify error:", err?.message || err);
    return { 
      ok: false, 
      error: String(err?.message || err),
      provider: 'brevo'
    };
  }
}

/* ==============
   Envío genérico
   ============== */
export async function enviarCorreo({ to, subject, html, text, headers = {} }) {
  const from = `"Medmanager" <${fromDom}>`;
  
  // Headers específicos para Brevo
  const brevoHeaders = {
    ...headers,
    'X-Sender': 'Medmanager <medleave8@gmail.com>',
    'X-Mailer': 'MedLeave-API'
  };

  try {
    const info = await transporter.sendMail({ 
      from, 
      to, 
      subject, 
      html, 
      text, 
      headers: brevoHeaders 
    });
    
    console.log("📨 Correo enviado via Brevo:", info.messageId, "→", to);
    return { ok: true, id: info.messageId, provider: 'brevo' };
  } catch (error) {
    console.error("❌ Error al enviar correo via Brevo:", error);
    return { 
      ok: false, 
      error: String(error?.message || error),
      provider: 'brevo'
    };
  }
}

/* ==============
   Utilidades de destinatarios
   ============== */
export function getSecretariaToList() {
  const raw = process.env.SECRETARIA_EMAILS || "";
  return raw.split(",").map(s => s.trim()).filter(Boolean);
}

/* ==========================================
   Plantilla: recuperación de contraseña
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
   NOTIFICACIÓN A ESTUDIANTE: Cambio de estado de licencia
   ========================================================== */
export async function notificarEstadoLicenciaEstudiante({
  to, // correo del estudiante
  folio,
  estudianteNombre,
  estado, // 'aceptado' o 'rechazado'
  motivo_rechazo = null,
  fechaInicio,
  fechaFin,
  observacion = null,
  enlaceDetalle = 'http://localhost:5173/'
}) {
  if (!to) {
    return { ok: false, error: "No hay destinatario especificado" };
  }

  const estadoTexto = estado === 'aceptado' ? 'APROBADA' : 'RECHAZADA';
  const estadoColor = estado === 'aceptado' ? '#10b981' : '#ef4444';
  
  const subject = `Licencia ${folio} · ${estadoTexto}`;
  
  const fechaInicioFmt = new Date(fechaInicio).toLocaleDateString("es-CL");
  const fechaFinFmt = new Date(fechaFin).toLocaleDateString("es-CL");

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;line-height:1.5;max-width:600px;margin:0 auto;">
      <div style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);padding:20px;text-align:center;color:white;">
        <h1 style="margin:0;font-size:24px;">medmanager</h1>
        <p style="margin:8px 0 0;opacity:0.9;">Sistema de Licencias Médicas</p>
      </div>
      
      <div style="padding:24px;background:#f9fafb;">
        <h2 style="color:#1f2937;margin:0 0 16px;">Estado de tu Licencia Médica</h2>
        
        <div style="background:white;border-radius:8px;padding:20px;border-left:4px solid ${estadoColor};">
          <div style="display:flex;align-items:center;margin-bottom:16px;">
            <div style="width:40px;height:40px;border-radius:50%;background:${estadoColor};display:flex;align-items:center;justify-content:center;margin-right:12px;">
              <span style="color:white;font-size:18px;">${estado === 'aceptado' ? '✓' : '✗'}</span>
            </div>
            <div>
              <h3 style="margin:0;color:#1f2937;">Licencia <strong>${estadoTexto}</strong></h3>
              <p style="margin:4px 0 0;color:#6b7280;font-size:14px;">Folio: ${folio}</p>
            </div>
          </div>
          
          <div style="border-top:1px solid #e5e7eb;padding-top:16px;">
            <p style="margin:0 0 12px;"><strong>Estudiante:</strong> ${estudianteNombre}</p>
            <p style="margin:0 0 12px;"><strong>Período:</strong> ${fechaInicioFmt} - ${fechaFinFmt}</p>
            
            ${estado === 'rechazado' && motivo_rechazo ? `
            <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:12px;margin:12px 0;">
              <p style="margin:0;color:#dc2626;font-size:14px;"><strong>Motivo del rechazo:</strong></p>
              <p style="margin:8px 0 0;color:#991b1b;font-size:14px;">${motivo_rechazo}</p>
            </div>
            ` : ''}
            
            ${observacion ? `
            <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:6px;padding:12px;margin:12px 0;">
              <p style="margin:0;color:#0369a1;font-size:14px;"><strong>Observación:</strong></p>
              <p style="margin:8px 0 0;color:#075985;font-size:14px;">${observacion}</p>
            </div>
            ` : ''}
            
            ${estado === 'aceptado' ? `
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:12px;margin:12px 0;">
              <p style="margin:0;color:#166534;font-size:14px;">
                ✅ <strong>Tu licencia ha sido aprobada.</strong> Ya no necesitas justificar inasistencias en el período indicado.
              </p>
            </div>
            ` : ''}
          </div>
        </div>
        
        <div style="text-align:center;margin:24px 0;">
          <a href="${enlaceDetalle}" target="_blank" rel="noopener" 
            style="display:inline-block;padding:12px 24px;background:#1a73e8;color:#fff;
            text-decoration:none;border-radius:8px;font-weight:500;">Ver Detalle en medmanager</a>
        </div>
        
        <div style="border-top:1px solid #e5e7eb;padding-top:16px;text-align:center;">
          <p style="color:#6b7280;font-size:12px;margin:0;">
            Este es un correo automático. Por favor no respondas a este mensaje.<br>
            Si tienes dudas, contacta a secretaría académica.
          </p>
        </div>
      </div>
    </div>`;

  const text = `Licencia Médica - ${estadoTexto}
  
Folio: ${folio}
Estudiante: ${estudianteNombre}
Período: ${fechaInicioFmt} - ${fechaFinFmt}

${estado === 'rechazado' && motivo_rechazo ? `Motivo del rechazo: ${motivo_rechazo}\n` : ''}
${observacion ? `Observación: ${observacion}\n` : ''}

${estado === 'aceptado' ? 
  '✅ Tu licencia ha sido aprobada. Ya no necesitas justificar inasistencias en el período indicado.' : 
  '❌ Tu licencia ha sido rechazada. Revisa el motivo indicado.'}

Ver detalle: ${enlaceDetalle}

---
Este es un correo automático. No responder.`;

  return enviarCorreo({ to, subject, html, text });
}

/* ==========================================================
   NOTIFICACIÓN: Nueva licencia creada (para estudiante)
   ========================================================== */
export async function notificarLicenciaCreadaEstudiante({
  to,
  folio,
  estudianteNombre,
  fechaInicio,
  fechaFin
}) {
  if (!to) {
    return { ok: false, error: "No hay destinatario especificado" };
  }

  const subject = `Licencia ${folio} · Enviada para revisión`;
  const fechaInicioFmt = new Date(fechaInicio).toLocaleDateString("es-CL");
  const fechaFinFmt = new Date(fechaFin).toLocaleDateString("es-CL");

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;line-height:1.5;max-width:600px;margin:0 auto;">
      <div style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);padding:20px;text-align:center;color:white;">
        <h1 style="margin:0;font-size:24px;">medmanager</h1>
        <p style="margin:8px 0 0;opacity:0.9;">Sistema de Licencias Médicas</p>
      </div>
      
      <div style="padding:24px;background:#f9fafb;">
        <h2 style="color:#1f2937;margin:0 0 16px;">Licencia Enviada para Revisión</h2>
        
        <div style="background:white;border-radius:8px;padding:20px;border-left:4px solid #f59e0b;">
          <div style="display:flex;align-items:center;margin-bottom:16px;">
            <div style="width:40px;height:40px;border-radius:50%;background:#f59e0b;display:flex;align-items:center;justify-content:center;margin-right:12px;">
              <span style="color:white;font-size:18px;">⏳</span>
            </div>
            <div>
              <h3 style="margin:0;color:#1f2937;">Licencia <strong>EN REVISIÓN</strong></h3>
              <p style="margin:4px 0 0;color:#6b7280;font-size:14px;">Folio: ${folio}</p>
            </div>
          </div>
          
          <div style="border-top:1px solid #e5e7eb;padding-top:16px;">
            <p style="margin:0 0 12px;"><strong>Estudiante:</strong> ${estudianteNombre}</p>
            <p style="margin:0 0 12px;"><strong>Período solicitado:</strong> ${fechaInicioFmt} - ${fechaFinFmt}</p>
            
            <div style="background:#fffbeb;border:1px solid #fed7aa;border-radius:6px;padding:12px;margin:12px 0;">
              <p style="margin:0;color:#92400e;font-size:14px;">
                📋 <strong>Tu licencia ha sido recibida y está en proceso de revisión.</strong><br>
                Serás notificado cuando se tome una decisión.
              </p>
            </div>
          </div>
        </div>
        
        <div style="border-top:1px solid #e5e7eb;padding-top:16px;text-align:center;">
          <p style="color:#6b7280;font-size:12px;margin:0;">
            Este es un correo automático. Por favor no respondas a este mensaje.
          </p>
        </div>
      </div>
    </div>`;

  const text = `Licencia Médica - Enviada para Revisión

Folio: ${folio}
Estudiante: ${estudianteNombre}
Período: ${fechaInicioFmt} - ${fechaFinFmt}

📋 Tu licencia ha sido recibida y está en proceso de revisión. Serás notificado cuando se tome una decisión.

---
Este es un correo automático. No responder.`;

  return enviarCorreo({ to, subject, html, text });
}

/* ==========================================================
   NUEVA LICENCIA: correo a secretaría/funcionarios
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
        text-decoration:none;border-radius:8px">Abrir en medmanager</a></p>
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
   Cambio de estado
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

/* ==========================================================
   NOTIFICACIÓN A PROFESOR: Licencia aceptada para su curso
   ========================================================== */
export async function notificarLicenciaAceptadaProfesor({
  to, // correo del profesor
  folio,
  estudianteNombre,
  nombreCurso,
  fechaInicio,
  fechaFin,
  enlaceDetalle = 'http://localhost:5173/'
}) {
  if (!to) {
    return { ok: false, error: "No hay destinatario especificado" };
  }

  const subject = `Licencia ${folio} aceptada para el curso ${nombreCurso}`;
  const fechaInicioFmt = new Date(fechaInicio).toLocaleDateString("es-CL");
  const fechaFinFmt = new Date(fechaFin).toLocaleDateString("es-CL");

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;line-height:1.5;max-width:600px;margin:0 auto;">
      <div style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);padding:20px;text-align:center;color:white;">
        <h1 style="margin:0;font-size:24px;">medmanager</h1>
        <p style="margin:8px 0 0;opacity:0.9;">Sistema de Licencias Médicas</p>
      </div>
      
      <div style="padding:24px;background:#f9fafb;">
        <h2 style="color:#1f2937;margin:0 0 16px;">Licencia Aceptada - Curso ${nombreCurso}</h2>
        
        <div style="background:white;border-radius:8px;padding:20px;border-left:4px solid #10b981;">
          <div style="display:flex;align-items:center;margin-bottom:16px;">
            <div style="width:40px;height:40px;border-radius:50%;background:#10b981;display:flex;align-items:center;justify-content:center;margin-right:12px;">
              <span style="color:white;font-size:18px;">✓</span>
            </div>
            <div>
              <h3 style="margin:0;color:#1f2937;">Licencia <strong>ACEPTADA</strong></h3>
              <p style="margin:4px 0 0;color:#6b7280;font-size:14px;">Folio: ${folio}</p>
            </div>
          </div>
          
          <div style="border-top:1px solid #e5e7eb;padding-top:16px;">
            <p style="margin:0 0 12px;"><strong>Estudiante:</strong> ${estudianteNombre}</p>
            <p style="margin:0 0 12px;"><strong>Curso:</strong> ${nombreCurso}</p>
            <p style="margin:0 0 12px;"><strong>Período de licencia:</strong> ${fechaInicioFmt} - ${fechaFinFmt}</p>
            
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:12px;margin:12px 0;">
              <p style="margin:0;color:#166534;font-size:14px;">
                ✅ <strong>La licencia ha sido aprobada.</strong> El estudiante está excusado de asistir a clases durante el período indicado.
              </p>
            </div>
          </div>
        </div>
        
        <div style="text-align:center;margin:24px 0;">
          <a href="${enlaceDetalle}" target="_blank" rel="noopener" 
            style="display:inline-block;padding:12px 24px;background:#1a73e8;color:#fff;
            text-decoration:none;border-radius:8px;font-weight:500;">Ver Detalle en medmanager</a>
        </div>
        
        <div style="border-top:1px solid #e5e7eb;padding-top:16px;text-align:center;">
          <p style="color:#6b7280;font-size:12px;margin:0;">
            Este es un correo automático. Por favor no respondas a este mensaje.<br>
            Sistema de Gestión de Licencias Médicas - Universidad Católica de Temuco
          </p>
        </div>
      </div>
    </div>`;

  const text = `Licencia Médica Aceptada - Curso ${nombreCurso}

Folio: ${folio}
Estudiante: ${estudianteNombre}
Curso: ${nombreCurso}
Período: ${fechaInicioFmt} - ${fechaFinFmt}

✅ La licencia ha sido aprobada. El estudiante está excusado de asistir a clases durante el período indicado.

Ver detalle: ${enlaceDetalle}

---
Este es un correo automático. No responder.`;

  return enviarCorreo({ to, subject, html, text });
}