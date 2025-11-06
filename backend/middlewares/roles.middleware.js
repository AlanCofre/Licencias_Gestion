// backend/middlewares/roles.middleware.js
export function esAdmin(req, res, next) {
  const role =
    req.user?.rol ||
    req.user?.role ||
    req.user?.tipo ||
    req.user?.perfil?.rol ||
    null;

  if (!role) {
    return res.status(401).json({ ok: false, error: "No autenticado" });
  }

  const r = String(role).toLowerCase();
  if (r !== "administrador" && r !== "admin") {
    return res.status(403).json({ ok: false, error: "Solo administradores" });
  }
  next();
}
