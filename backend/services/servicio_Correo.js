// services/mailService.js
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.BREVO_HOST,
  port: Number(process.env.BREVO_PORT),
  secure: false,
  auth: {
    user: process.env.BREVO_USER,
    pass: process.env.BREVO_PASS,
  },
});

/**
 * Envía un correo con el código de recuperación de contraseña.
 * @param {string} to - Dirección de correo del usuario.
 * @param {string} code - Código de recuperación.
 */
export const enviarCodigoRecuperacion = async (to, code) => {
  try {
    const info = await transporter.sendMail({
      from: `"Soporte MedLeave" <${process.env.BREVO_DOM}>`,
      to,
      subject: "Código para restablecer tu contraseña",
      text: `Tu código de verificación es: ${code}`,
      html: `
        <div style="font-family:sans-serif">
          <h2>Restablecimiento de contraseña</h2>
          <p>Tu código de verificación es:</p>
          <h3 style="color:#1a73e8">${code}</h3>
          <p>Este código expirará en 10 minutos.</p>
        </div>
      `,
    });

    console.log("📨 Correo enviado:", info.messageId);
    return true;
  } catch (error) {
    console.error("❌ Error al enviar correo:", error);
    return false;
  }
}

