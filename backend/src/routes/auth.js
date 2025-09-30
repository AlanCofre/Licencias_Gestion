// src/routes/auth.js
const express = require('express');
const rateLimit = require('express-rate-limit');
const { requestPasswordReset, confirmPasswordReset } =
  require('../controllers/passwordResetController');

const router = express.Router();

const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
router.post('/password-reset/request',
  rateLimit({ windowMs, max: Number(process.env.RATE_LIMIT_MAX || 20) }),
  requestPasswordReset
);
router.post('/password-reset/confirm',
  rateLimit({ windowMs, max: Number(process.env.RATE_LIMIT_MAX_CONFIRM || 10) }),
  confirmPasswordReset
);

module.exports = router;
