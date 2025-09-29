export const requireRole = (rolesPermitidos=[]) => (req,res,next)=>{
  if(!req.user?.rol || !rolesPermitidos.includes(req.user.rol)){
    return res.status(403).json({ ok:false, error:'No autorizado' });
  }
  next();
};