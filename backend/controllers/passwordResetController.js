// src/controllers/passwordResetController.js
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import db from '../config/db.js'; // mysql2/promise pool

const TTL_MIN = Number(process.env.RESET_CODE_TTL_MIN || 10); // minutos
const MAX_ATTEMPTS = Number(process.env.RESET_MAX_ATTEMPTS || 5);

const NEUTRAL_MSG =
  'Si la dirección existe, enviaremos instrucciones para restablecer la contraseña.';

// ===== Almacenamiento en memoria (solo DEV/LOCAL) =====
// Mapa por email -> { codeHash, expiresAt (Date), attempts, used }
const resetStore = new Map();

/** Genera un código numérico fijo de longitud len (e.g., 6 dígitos). */
function generateNumericCode(len = 6) {
  const n = crypto.randomInt(0, 10 ** len);
  return n.toString().padStart(len, '0');
}

/** Limpia entradas expiradas periódicamente (opcional) */
setInterval(() => {
  const now = Date.now();
  for (const [email, entry] of resetStore.entries()) {
    if (entry.used || entry.expiresAt.getTime() <= now) {
      resetStore.delete(email);
    }
  }
}, 60 * 1000); // cada 60s

// POST /usuarios/password-reset/request  { email }
export const requestPasswordReset = async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ message: 'Faltan datos.' });

  try {
    // buscar usuario por correo_usuario (tabla: usuario)
    const [rows] = await db.execute(
      'SELECT id_usuario FROM usuario WHERE correo_usuario = ? LIMIT 1',
      [email]
    );

    if (rows.length) {
      const code = generateNumericCode(6);
      const codeHash = await bcrypt.hash(code, 10);
      const expiresAt = new Date(Date.now() + TTL_MIN * 60 * 1000);

      // Guardar en memoria (sobrescribe cualquier código previo)
      resetStore.set(email, { codeHash, expiresAt, attempts: 0, used: false });

      if (process.env.NODE_ENV !== 'production') {
        console.log('🔐 RESET CODE DEV →', code, 'para', email, 'expira a las', expiresAt.toISOString());
      }
      // Si más adelante activan mailer, enviar el código por correo aquí.
    }

    // respuesta neutral siempre (no revelar existencia)
    return res.status(200).json({ message: NEUTRAL_MSG });
  } catch (e) {
    console.error('[password-reset/request] ERROR:', e);
    return res.status(500).json({ message: 'Error interno' });
  }
};

// POST /usuarios/password-reset/confirm  { email, code, newPassword }
export const confirmPasswordReset = async (req, res) => {
  const { email, code, newPassword } = req.body || {};
  if (!email || !code || !newPassword) {
    return res.status(400).json({ message: 'Faltan datos.' });
  }

  try {
    // buscar usuario real en BD (neutral si no existe)
    const [u] = await db.execute(
      'SELECT id_usuario FROM usuario WHERE correo_usuario = ? LIMIT 1',
      [email]
    );
    if (!u.length) return res.status(200).json({ message: NEUTRAL_MSG });

    const { id_usuario } = u[0];

    // Obtener último código en memoria
    const entry = resetStore.get(email);
    if (
      !entry ||
      entry.used ||
      entry.expiresAt.getTime() <= Date.now()
    ) {
      return res.status(400).json({ message: 'Código inválido o expirado.' });
    }

    if (entry.attempts >= MAX_ATTEMPTS) {
      return res
        .status(429)
        .json({ message: 'Demasiados intentos. Solicita un nuevo código.' });
    }

    const ok = await bcrypt.compare(code, entry.codeHash);
    if (!ok) {
      entry.attempts += 1;
      resetStore.set(email, entry);
      return res.status(400).json({ message: 'Código inválido o expirado.' });
    }

    // Código correcto → actualizar contraseña en BD
    const newHash = await bcrypt.hash(newPassword, 10);

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      await conn.execute(
        'UPDATE usuario SET contrasena = ? WHERE id_usuario = ?',
        [newHash, id_usuario]
      );

      await conn.commit();

      // Marcar usado y eliminar de la memoria
      entry.used = true;
      resetStore.delete(email);

      return res
        .status(200)
        .json({ message: 'La contraseña se ha actualizado correctamente.' });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error('[password-reset/confirm] ERROR:', e);
    return res.status(500).json({ message: 'Error interno' });
  }
};
