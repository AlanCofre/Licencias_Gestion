// backend/services/servicio_Licencias.js
// ESM

import crypto from 'crypto';
import { Op, QueryTypes } from 'sequelize';

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
      estado: { [Op.in]: ['pendiente', 'aceptado'] }, // puedes ajustar si quieres considerar 'rechazado'
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
 * Decidir licencia (aceptar/rechazar) — CORREGIDO
 * ======================================================= */
export async function decidirLicenciaSvc({
  idLicencia,
  decision,          // 'aceptado' | 'rechazado'
  estado,            // compat
  motivo_rechazo,    // obligatorio si rechaza
  observacion,       // opcional
  _fi,               // fecha_inicio (YYYY-MM-DD) si se acepta
  _ff,               // fecha_fin    (YYYY-MM-DD) si se acepta
  idSecretario,      // usuario funcionario que decide
}) {
  const DEC = (decision ?? estado ?? '').toLowerCase().trim();
  if (!['aceptado', 'rechazado'].includes(DEC)) {
    const e = new Error('DECISION_INVALIDA');
    e.http = 400;
    throw e;
  }

  const tx = await LicenciaMedica.sequelize.transaction();
  try {
    // Bloqueo de fila para evitar carreras
    const lic = await LicenciaMedica.findByPk(idLicencia, {
      transaction: tx,
      lock: true
    });

    if (!lic) {
      const e = new Error('LICENCIA_NO_ENCONTRADA');
      e.http = 404;
      throw e;
    }

    const actual = String(lic.estado || '').toLowerCase().trim();
    if (['aceptado', 'rechazado'].includes(actual)) {
      const e = new Error(`La licencia ya fue ${actual}`);
      e.http = 409;
      throw e;
    }
    if (actual !== 'pendiente') {
      const e = new Error('ESTADO_NO_PERMITE_DECIDIR');
      e.http = 409;
      throw e;
    }

    if (DEC === 'aceptado') {
      // 1) Debe existir archivo con hash
      let archivo = null;
      try {
        archivo = await ArchivoLicencia.findOne({
          where: { id_licencia: lic.id_licencia, hash: { [Op.ne]: null } },
          transaction: tx
        });
      } catch (_) { /* caerá al fallback */ }

      if (!archivo) {
        const rows = await LicenciaMedica.sequelize.query(
          'SELECT 1 AS ok FROM ArchivoLicencia WHERE id_licencia = ? AND hash IS NOT NULL LIMIT 1',
          { replacements: [lic.id_licencia], type: QueryTypes.SELECT, transaction: tx }
        );
        if (!rows.length) {
          const e = new Error('No se puede aceptar sin archivo válido (hash)');
          e.http = 422;
          throw e;
        }
      }

      // 2) Fechas a usar (de correcciones o de la licencia)
      const fechaInicio = _fi ?? lic.fecha_inicio;
      const fechaFin    = _ff ?? lic.fecha_fin;

      if (!fechaInicio || !fechaFin) {
        const e = new Error('RANGO_FECHAS_INVALIDO');
        e.http = 422;
        throw e;
      }
      if (new Date(fechaInicio) > new Date(fechaFin)) {
        const e = new Error('RANGO_FECHAS_INVALIDO');
        e.http = 422;
        throw e;
      }

      // 3) Evitar solape con OTRAS aceptadas del mismo usuario
      const solape = await LicenciaMedica.findOne({
        where: {
          id_usuario: lic.id_usuario,
          estado: 'aceptado',
          id_licencia: { [Op.ne]: lic.id_licencia },
          [Op.or]: [
            { fecha_inicio: { [Op.between]: [fechaInicio, fechaFin] } },
            { fecha_fin:    { [Op.between]: [fechaInicio, fechaFin] } },
            {
              [Op.and]: [
                { fecha_inicio: { [Op.lte]: fechaInicio } },
                { fecha_fin:    { [Op.gte]: fechaFin } }
              ]
            }
          ]
        },
        transaction: tx
      });
      if (solape) {
        const e = new Error('SOLAPAMIENTO_CON_OTRA_ACEPTADA');
        e.http = 422;
        throw e;
      }

      // 4) Persistir cambios
      lic.estado = 'aceptado';
      lic.fecha_inicio = fechaInicio;
      lic.fecha_fin = fechaFin;
      lic.motivo_rechazo = null;
      await lic.save({ transaction: tx });

      await HistorialLicencias.create({
        id_licencia: lic.id_licencia,
        id_usuario: idSecretario,
        estado: 'aceptado',            
        observacion: observacion ?? null,
        fecha_actualizacion: new Date()
      }, { transaction: tx });

      await tx.commit();
      return { ok: true, estado: 'aceptado' };
    }

    // === Rechazado ===
    if (DEC === 'rechazado') {
      if (!motivo_rechazo || !String(motivo_rechazo).trim()) {
        const e = new Error('Debe incluir motivo_rechazo al rechazar');
        e.http = 400;
        throw e;
      }

      lic.estado = 'rechazado';
      lic.motivo_rechazo = String(motivo_rechazo).trim();
      await lic.save({ transaction: tx });

      await HistorialLicencias.create({
        id_licencia: lic.id_licencia,
        id_usuario: idSecretario,
        estado: 'rechazado',           // << aquí
        observacion: lic.motivo_rechazo,
        fecha_actualizacion: new Date()
      }, { transaction: tx });

      await tx.commit();
      return { ok: true, estado: 'rechazado' };
    }

    // Nunca debería llegar aquí
    const e = new Error('DECISION_DESCONOCIDA');
    e.http = 400;
    throw e;
  } catch (err) {
    await tx.rollback();
    throw err;
  }
}

