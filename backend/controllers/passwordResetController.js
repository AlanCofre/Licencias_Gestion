// src/controllers/passwordResetController.js
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { Usuario, PasswordResetCode, sequelize } = require('../models');
const { sendPasswordResetEmail } = require('../utils/mailer');

const TTL_MIN = Number(process.env.RESET_CODE_TTL_MIN || 10);
const MAX_ATTEMPTS = Number(process.env.RESET_MAX_ATTEMPTS || 5);

const NEUTRAL_MSG =
  'Si la dirección existe, enviaremos instrucciones para restablecer la contraseña.';

function generateNumericCode(len = 6) {
  const n = crypto.randomInt(0, 10 ** len);
  return n.toString().padStart(len, '0');
}

exports.requestPasswordReset = async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ message: 'Faltan datos.' });

  try {
    // Busca por tu columna real en la tabla usuario
    const user = await Usuario.findOne({ where: { correo_usuario: email } });

    if (user) {
      const code = generateNumericCode(6);
      const code_hash = await bcrypt.hash(code, 10);
      const expires_at = new Date(Date.now() + TTL_MIN * 60 * 1000);

      // Guarda el código con TTL
      await PasswordResetCode.create({
        user_id: user.id_usuario,
        code_hash,
        expires_at,
      });

      // En DEV imprime el código y usa Ethereal si no hay SMTP
      if (process.env.NODE_ENV !== 'production') {
        console.log('🔐 RESET CODE DEV →', code, 'para', email);
      }
      try {
        await sendPasswordResetEmail(email, code);
      } catch (e) {
        // No rompemos la neutralidad si falla el correo
        console.warn('⚠️ Mailer:', e.message);
      }
    }

    return res.status(200).json({ message: NEUTRAL_MSG });
  } catch (e) {
    console.error('[password-reset/request] ERROR:', e);
    return res.status(500).json({ message: 'Error interno' });
  }
};

const { Op } = require('sequelize');

exports.confirmPasswordReset = async (req, res) => {
  const { email, code, newPassword } = req.body || {};
  if (!email || !code || !newPassword) {
    return res.status(400).json({ message: 'Faltan datos.' });
  }

  try {
    const user = await Usuario.findOne({ where: { correo_usuario: email } });
    if (!user) return res.status(200).json({ message: NEUTRAL_MSG });

    // FIX: usar Op en vez de literal + replacements
    const pr = await PasswordResetCode.findOne({
      where: {
        user_id: user.id_usuario,
        used_at: { [Op.is]: null },
        expires_at: { [Op.gt]: new Date() },
      },
      order: [['id', 'DESC']],
    });

    if (!pr) return res.status(400).json({ message: 'Código inválido o expirado.' });
    if (pr.attempts >= MAX_ATTEMPTS) {
      return res.status(429).json({ message: 'Demasiados intentos. Solicita un nuevo código.' });
    }

    const ok = await bcrypt.compare(code, pr.code_hash);
    if (!ok) {
      await pr.update({ attempts: pr.attempts + 1 });
      return res.status(400).json({ message: 'Código inválido o expirado.' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);

    await sequelize.transaction(async (t) => {
      await Usuario.update(
        { contrasena: newHash, password_changed_at:sequelize.fn('NOW'),},
        { where: { id_usuario: user.id_usuario }, transaction: t }
      );

      await pr.update({ used_at: sequelize.fn('NOW') }, { transaction: t });

      await PasswordResetCode.update(
        { used_at: sequelize.fn('NOW') },
        { where: { user_id: user.id_usuario, used_at: null }, transaction: t }
      );
    });

    return res.status(200).json({ message: 'La contraseña se ha actualizado correctamente.' });
  } catch (e) {
    console.error('[password-reset/confirm] ERROR:', e);
    return res.status(500).json({ message: 'Error interno' });
  }
};
