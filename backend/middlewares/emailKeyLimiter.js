const bucket = new Map(); // para producción, usa Redis


function emailKeyLimiter(max = 5, windowMs = 5 * 60 * 1000) {
return (req, res, next) => {
const ip = req.ip;
const email = (req.body && req.body.email) || 'no-email';
const key = `${ip}:${email}`;
const now = Date.now();


const info = bucket.get(key) || { count: 0, resetAt: now + windowMs };
if (now > info.resetAt) {
info.count = 0;
info.resetAt = now + windowMs;
}
info.count += 1;
bucket.set(key, info);


if (info.count > max) {
return res.status(429).json({ message: 'Demasiadas solicitudes. Intenta más tarde.' });
}
next();
};
}


module.exports = { emailKeyLimiter };