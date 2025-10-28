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
    req.audit = async (accion, recurso, payload = null) => {
      try {
        // Validación de acción (evita errores de ENUM)
        if (!ACCIONES_PERMITIDAS.has(accion)) {
          console.warn(`[audit] ⚠️ Acción inválida: "${accion}" (no está en el ENUM)`)
          return
        }

        const id_usuario = req.user?.id_usuario ?? null

        // IP segura con fallback (evita "Column 'ip' cannot be null")
        const xff = req.headers['x-forwarded-for']
        const ip =
          (Array.isArray(xff) ? xff[0] : (xff || ''))
            .split(',')[0]
            .trim() ||
          req.ip ||
          'desconocida'

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
