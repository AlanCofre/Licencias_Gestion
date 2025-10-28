// backend/middlewares/audit.middleware.js
import { auditLog } from '../services/audit.service.js'

export function attachAudit() {
  return (req, _res, next) => {
    req.audit = async (accion, recurso, payload = null, options = {}) => {
      const idUsuario = (req.user && req.user.id_usuario) || null
      const ip = req.ip || req.headers['x-forwarded-for'] || null
      await auditLog({ id_usuario: idUsuario, accion, recurso, payload, ip }, options)
    }
    next()
  }
}
