import LogAuditoria from '../src/models/LogAuditoria.js'

export async function auditLog({ id_usuario=null, accion, recurso, payload=null, ip=null }, options = {}) {
  const payloadStr = payload && typeof payload !== 'string' ? JSON.stringify(payload) : payload
  await LogAuditoria.create({ id_usuario, accion, recurso, payload: payloadStr, ip }, options)
}
