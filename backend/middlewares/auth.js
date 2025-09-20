const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');


async function authRequired(req, res, next) {
try {
const auth = req.headers.authorization || '';
const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
if (!token) return res.status(401).json({ message: 'No autorizado' });


const payload = jwt.verify(token, process.env.JWT_SECRET);
const user = await Usuario.findByPk(payload.sub);
if (!user) return res.status(401).json({ message: 'No autorizado' });


if (user.password_changed_at) {
const iatMs = (payload.iat || 0) * 1000;
const pwdChangedMs = new Date(user.password_changed_at).getTime();
if (iatMs < pwdChangedMs) {
return res.status(401).json({ message: 'Sesión inválida. Inicia sesión nuevamente.' });
}
}


req.user = user;
next();
} catch (err) {
return res.status(401).json({ message: 'No autorizado' });
}
}


module.exports = { authRequired };