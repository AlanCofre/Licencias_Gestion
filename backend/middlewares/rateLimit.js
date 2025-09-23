const rateLimit = require('express-rate-limit');


const globalLimiter = rateLimit({
windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000),
max: Number(process.env.RATE_LIMIT_MAX || 10),
standardHeaders: true,
legacyHeaders: false,
message: { message: 'Demasiadas solicitudes. Intenta más tarde.' },
});


module.exports = { globalLimiter };