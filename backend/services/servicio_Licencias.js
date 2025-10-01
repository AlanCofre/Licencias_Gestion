// backend/services/servicio_Licencias.js
// ESM

import crypto from 'crypto';
import { Op } from 'sequelize';

// 👇 Imports según tu estructura (services/ ↔ src/models/)
import LicenciaMedica from '../src/models/modelo_LicenciaMedica.js';
import HistorialLicencias from '../src/models/modelo_HistorialLicencias.js';
import ArchivoLicencia from '../src/models/modelo_ArchivoLicencia.js';

/* =======================================================
 * Utilidades
 * =======================================================
 */
export function sha256FromBuffer(bufOrStr) {
  const h = crypto.createHash('sha256');
  h.update(bufOrStr);
  return h.digest('hex');
}

/* =======================================================
 * Validaciones: fechas superpuestas + hash duplicado
 * =======================================================
 */
export async function validarNuevaLicencia({
  idUsuario,
  fechaInicio,
  fechaFin,
  hashArchivoSha256, // opcional
}) {
  // A) Fechas superpuestas (rango inclusivo)
  const licSolapada = await LicenciaMedica.findOne({
    where: {
      id_usuario: idUsuario,
      estado: { [Op.in]: ['pendiente', 'aceptado'] }, // ajusta si quieres incluir 'rechazado'
      [Op.and]: [
        { fecha_inicio: { [Op.lte]: fechaFin } },
        { fecha_fin:     { [Op.gte]: fechaInicio } },
      ],
    },
    attributes: ['id_licencia', 'fecha_inicio', 'fecha_fin', 'estado'],
  });

  if (licSolapada) {
    const e = new Error(
      `Fechas superpuestas con una licencia existente. ` +
      `Se superpone con licencia #${licSolapada.id_licencia} ` +
      `(${licSolapada.fecha_inicio} a ${licSolapada.fecha_fin}, estado: ${licSolapada.estado}).`
    );
    e.code = 'LICENCIA_FECHAS_SUPERPUESTAS';
    e.http = 409;
    throw e;
  }

  // B) Hash duplicado (si viene)
  if (hashArchivoSha256) {
    const archivoPrevio = await ArchivoLicencia.findOne({
      where: { hash: hashArchivoSha256 }, // tu columna real es "hash"
      include: [{
        model: LicenciaMedica,
        as: 'licencia',     // ⚠️ Debe existir esta asociación en el modelo
        required: true,
        where: { id_usuario: idUsuario },
        attributes: ['id_licencia'],
      }],
      attributes: ['id_archivo', 'hash'],
    });

    if (archivoPrevio) {
      const e = new Error(
        `Este archivo ya fue usado en la licencia #${archivoPrevio.licencia.id_licencia}.`
      );
      e.code = 'ARCHIVO_HASH_DUPLICADO';
      e.http = 409;
      throw e;
    }
  }
}

/* =======================================================
 * Crear licencia + (opcional) archivo — con transacción
 * =======================================================
 */
export async function crearLicenciaConArchivo({
  idUsuario,
  fechaInicio,
  fechaFin,
  motivo,
  // archivo:
  archivoBuffer,     // si llega por multipart (req.file.buffer)
  archivoHashHex,    // si FE ya lo calculó
  archivoUrl,        // ⚠️ requerido por tu modelo si insertas archivo (ruta_url NOT NULL)
  archivoMime,
  archivoBytes,
}) {
  const hash = archivoHashHex ?? (archivoBuffer ? sha256FromBuffer(archivoBuffer) : null);

  await validarNuevaLicencia({
    idUsuario,
    fechaInicio,
    fechaFin,
    hashArchivoSha256: hash,
  });

  const tx = await LicenciaMedica.sequelize.transaction();
  try {
    const lic = await LicenciaMedica.create({
      id_usuario: idUsuario,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      motivo,
      estado: 'pendiente',
    }, { transaction: tx });

    // Insertar registro de archivo solo si hay datos del archivo
    if (hash || archivoUrl || archivoMime || typeof archivoBytes === 'number') {
      await ArchivoLicencia.create({
        id_licencia: lic.id_licencia,                 // ⚠️ tu modelo debe tener este campo
        hash: hash ?? null,
        ruta_url: archivoUrl ?? 'local://sin-url',    // evita violar allowNull:false durante pruebas
        tipo_mime: archivoMime ?? 'application/octet-stream',
        tamano: typeof archivoBytes === 'number'
          ? archivoBytes
          : (archivoBuffer?.length ?? 0),
        // fecha_subida usa default NOW del modelo
      }, { transaction: tx });
    }

    await tx.commit();
    return { id_licencia: lic.id_licencia };
  } catch (e) {
    await tx.rollback();
    throw e;
  }
}

/* =======================================================
 * Decidir licencia (aceptar/rechazar) — tu flujo existente
 * =======================================================
 */
export async function decidirLicenciaSvc({
  idLicencia,
  estado,
  motivo_rechazo,
  idSecretario,
}) {
  const licencia = await LicenciaMedica.findByPk(idLicencia);
  if (!licencia) throw new Error('Licencia no encontrada');

  const actual = String(licencia.estado || '').toLowerCase().trim();
  const RESUELTOS = ['aceptado', 'rechazado'];
  if (RESUELTOS.includes(actual)) {
    throw new Error(`La licencia ya fue ${licencia.estado}`);
  }

  licencia.estado = estado; // 'aceptado' | 'rechazado'
  licencia.motivo_rechazo = (estado === 'rechazado') ? motivo_rechazo : null;
  await licencia.save();

  await HistorialLicencias.create({
    id_licencia: licencia.id_licencia,
    id_usuario: idSecretario,
    estado,
    motivo_rechazo: motivo_rechazo || null,
  });

  return licencia;
}
