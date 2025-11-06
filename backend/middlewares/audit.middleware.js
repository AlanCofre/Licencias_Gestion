// backend/middlewares/audit.middleware.js
import LogAuditoria from '../src/models/LogAuditoria.js'

// Debe coincidir EXACTO con el ENUM de la tabla `logauditoria`
const ACCIONES_PERMITIDAS = new Set([
  'crear cuenta',
  'actualizar cuenta',
  'iniciar sesion',
  'recuperar contraseña',
  'emitir licencia',
  'aceptar licencia',
  'rechazar licencia',
])

/**
 * Middleware que adjunta req.audit(accion, recurso, payload?)
 * y registra en la tabla `logauditoria`.
 */
export function attachAudit() {
  return (req, _res, next) => {
    req.audit = async (accion, recurso, payload = null, opts = {}) => {
      try {
        // Guard: si se pasa opts.userId úsalo, sino obtener de req.user (compatibilidad)
        const id_usuario = opts?.userId ?? req.user?.id_usuario ?? req.user?.id ?? null

        // Si no hay usuario, no intentar insertar (evita FK violation)
        if (!id_usuario) {
          console.log('[audit] skip -> no valid user id to satisfy FK')
          return
        }

        // Validación de acción (evita errores de ENUM) — opcional: solo warn y continuar
        if (!ACCIONES_PERMITIDAS.has(accion)) {
          console.warn(`[audit] ⚠️ Acción no incluida en ENUM: "${accion}"`)
        }

        // IP segura con fallback
        const xff = req.headers['x-forwarded-for']
        const ip = (Array.isArray(xff) ? xff[0] : (xff || '')).split(',')[0].trim() || req.ip || 'desconocida'

        await LogAuditoria.create({
          id_usuario,
          accion,
          recurso,
          payload: payload ? JSON.stringify(payload) : null,
          ip,
          fecha: new Date(),
        })
      } catch (err) {
        console.error('[audit] Error registrando log:', err?.message || err)
      }
    }

    next()
  }
}
