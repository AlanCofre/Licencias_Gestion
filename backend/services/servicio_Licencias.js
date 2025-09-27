// backend/services/servicio_Licencias.js
import LicenciaMedica from '../src/models/modelo_LicenciaMedica.js';
import HistorialLicencias from '../src/models/modelo_HistorialLicencias.js';

export async function decidirLicenciaSvc({ idLicencia, estado, observacion, idSecretario }) {
  const licencia = await LicenciaMedica.findByPk(idLicencia);
  if (!licencia) throw new Error('Licencia no encontrada');

  const actual = String(licencia.estado || '').toLowerCase().trim();
  const RESUELTOS = ['aceptado', 'rechazado'];

  if (RESUELTOS.includes(actual)) {
    throw new Error(`La licencia ya fue ${licencia.estado}`);
  }

  // actualizar licencia con los valores finales de tu BD
  licencia.estado = estado; // 'aceptado' | 'rechazado'
  licencia.motivo_rechazo = (estado === 'rechazado') ? observacion : null;
  await licencia.save();

  await HistorialLicencias.create({
    id_licencia: licencia.id_licencia,
    id_usuario: idSecretario,
    estado: estado,                // mapea a estado_actual en el modelo
    observacion: observacion || null
  });

  return licencia;
}

