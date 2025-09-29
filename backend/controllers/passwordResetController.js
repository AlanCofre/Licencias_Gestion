// src/controllers/passwordResetController.js
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import db from '../config/db.js'; // mysql2/promise pool

const TTL_MIN = Number(process.env.RESET_CODE_TTL_MIN || 10); // minutos
const MAX_ATTEMPTS = Number(process.env.RESET_MAX_ATTEMPTS || 5);

const NEUTRAL_MSG =
  'Si la dirección existe, enviaremos instrucciones para restablecer la contraseña.';

function generateNumericCode(len = 6) {
  const n = crypto.randomInt(0, 10 ** len);
  return n.toString().padStart(len, '0');
}

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
      const { id_usuario } = rows[0];

      const code = generateNumericCode(6);
      const code_hash = await bcrypt.hash(code, 10);
      const expires_at = new Date(Date.now() + TTL_MIN * 60 * 1000);

      // guardar código (tabla: password_reset_codes)
      await db.execute(
        'INSERT INTO password_reset_codes (user_id, code_hash, expires_at, attempts, used_at) VALUES (?,?,?,?,NULL)',
        [id_usuario, code_hash, expires_at, 0]
      );

      if (process.env.NODE_ENV !== 'production') {
        console.log('🔐 RESET CODE DEV →', code, 'para', email);
      }
      // si tienes mailer, puedes enviar el code por correo aquí (opcional)
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
    // buscar usuario
    const [u] = await db.execute(
      'SELECT id_usuario FROM usuario WHERE correo_usuario = ? LIMIT 1',
      [email]
    );
    if (!u.length) return res.status(200).json({ message: NEUTRAL_MSG });

    const { id_usuario } = u[0];

    // último código activo no usado y no expirado
    const [prRows] = await db.execute(
      `SELECT id, code_hash, attempts
         FROM password_reset_codes
        WHERE user_id = ?
          AND used_at IS NULL
          AND expires_at > NOW()
        ORDER BY id DESC
        LIMIT 1`,
      [id_usuario]
    );
    if (!prRows.length) {
      return res.status(400).json({ message: 'Código inválido o expirado.' });
    }

    const pr = prRows[0];
    if (pr.attempts >= MAX_ATTEMPTS) {
      return res
        .status(429)
        .json({ message: 'Demasiados intentos. Solicita un nuevo código.' });
    }

    const ok = await bcrypt.compare(code, pr.code_hash);
    if (!ok) {
      await db.execute('UPDATE password_reset_codes SET attempts = attempts + 1 WHERE id = ?', [
        pr.id,
      ]);
      return res.status(400).json({ message: 'Código inválido o expirado.' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);

    // ===== Transacción usando una conexión del pool =====
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      await conn.execute(
        'UPDATE usuario SET contrasena = ?, password_changed_at = NOW() WHERE id_usuario = ?',
        [newHash, id_usuario]
      );

      await conn.execute('UPDATE password_reset_codes SET used_at = NOW() WHERE id = ?', [pr.id]);

      // opcional: invalidar otros códigos activos del mismo usuario
      await conn.execute(
        'UPDATE password_reset_codes SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL',
        [id_usuario]
      );

      await conn.commit();
      return res
        .status(200)
        .json({ message: 'La contraseña se ha actualizado correctamente.' });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
    // ===== Fin transacción =====
  } catch (e) {
    console.error('[password-reset/confirm] ERROR:', e);
    return res.status(500).json({ message: 'Error interno' });
  }
};
