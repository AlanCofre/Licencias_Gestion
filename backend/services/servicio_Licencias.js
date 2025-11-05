// backend/services/servicio_Licencias.js
// ESM

import crypto from 'crypto';
import { Op, QueryTypes } from 'sequelize';

// 👇 Imports según tu estructura (services/ ↔ src/models/)
import LicenciaMedica from '../src/models/modelo_LicenciaMedica.js';
import HistorialLicencias from '../src/models/modelo_HistorialLicencias.js';
import ArchivoLicencia from '../src/models/modelo_ArchivoLicencia.js';
import { Matricula, LicenciasEntregas } from '../src/models/index.js';
/* =======================================================
 * Utilidades
 * ======================================================= */
export function sha256FromBuffer(bufOrStr) {
  const h = crypto.createHash('sha256');
  h.update(bufOrStr);
  return h.digest('hex');
}

/* =======================================================
 * Validaciones: fechas superpuestas + hash duplicado
 * ======================================================= */
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
      estado: { [Op.in]: ['pendiente', 'aceptado'] },
      [Op.and]: [
        { fecha_inicio: { [Op.lte]: fechaFin } },
        { fecha_fin: { [Op.gte]: fechaInicio } },
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
      where: { hash: hashArchivoSha256 },
      include: [
        {
          model: LicenciaMedica,
          as: 'licencia', // ⚠️ Debe existir esta asociación en el modelo
          required: true,
          where: { id_usuario: idUsuario },
          attributes: ['id_licencia'],
        },
      ],
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
 * ======================================================= */
export async function crearLicenciaConArchivo({
  idUsuario,
  fechaInicio,
  fechaFin,
  motivo,
  // archivo:
  archivoBuffer, // si llega por multipart (req.file.buffer)
  archivoHashHex, // si FE ya lo calculó
  archivoUrl, // ⚠️ requerido por tu modelo si insertas archivo (ruta_url NOT NULL)
  archivoMime,
  archivoBytes,
}) {
  const hash =
    archivoHashHex ?? (archivoBuffer ? sha256FromBuffer(archivoBuffer) : null);

  await validarNuevaLicencia({
    idUsuario,
    fechaInicio,
    fechaFin,
    hashArchivoSha256: hash,
  });

  const tx = await LicenciaMedica.sequelize.transaction();
  try {
    const lic = await LicenciaMedica.create(
      {
        id_usuario: idUsuario,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        motivo,
        estado: 'pendiente',
      },
      { transaction: tx }
    );

    // Insertar registro de archivo solo si hay datos del archivo
    if (hash || archivoUrl || archivoMime || typeof archivoBytes === 'number') {
      await ArchivoLicencia.create(
        {
          id_licencia: lic.id_licencia, // ⚠️ tu modelo debe tener este campo
          hash: hash ?? null,
          ruta_url: archivoUrl ?? 'local://sin-url', // evita violar allowNull:false durante pruebas
          tipo_mime: archivoMime ?? 'application/octet-stream',
          tamano:
            typeof archivoBytes === 'number'
              ? archivoBytes
              : archivoBuffer?.length ?? 0,
          // fecha_subida usa default NOW del modelo
        },
        { transaction: tx }
      );
    }

    await tx.commit();
    return { id_licencia: lic.id_licencia };
  } catch (e) {
    await tx.rollback();
    throw e;
  }
}

/* =======================================================
 * Decidir licencia (aceptar/rechazar) — ROBUSTO
 * ======================================================= */
async function registrarNotificacionesYAuditoria({
  licencia,
  estado,
  motivo_rechazo,
  actorId,
  ip = '0.0.0.0',
  conn // Sequelize transaction
}) {
  // Auditoría
  await conn.sequelize.query(
    `INSERT INTO logauditoria (accion, recurso, payload, ip, fecha, id_usuario)
     VALUES (?, ?, ?, ?, NOW(), ?)`,
    {
      replacements: [
        'cambiar estado',
        'licenciamedica',
        JSON.stringify({
          id_licencia: licencia.id_licencia,
          estado_anterior: licencia.estado,
          estado_nuevo: estado
        }),
        ip,
        actorId
      ],
      transaction: conn
    }
  );

  // Notificación al estudiante
  if (licencia.id_usuario) {
    const mensajeEstudiante = estado === 'rechazado'
      ? 'Tu licencia ha sido rechazada. Revisa el motivo en el sistema.'
      : 'Tu licencia ha sido aprobada. Ya no necesitas justificar asistencia.';

    await conn.sequelize.query(
      `INSERT INTO notificacion (asunto, contenido, leido, fecha_envio, id_usuario)
       VALUES (?, ?, 0, NOW(), ?)`,
      {
        replacements: [`Licencia ${estado}`, mensajeEstudiante, licencia.id_usuario],
        transaction: conn
      }
    );
  }

  // Notificación al profesor (solo si fue aceptada)
  if (estado === 'aceptado' && licencia.id_profesor) {
    await conn.sequelize.query(
      `INSERT INTO notificacion (asunto, contenido, leido, fecha_envio, id_usuario)
       VALUES (?, ?, 0, NOW(), ?)`,
      {
        replacements: [
          'Licencia aprobada del estudiante',
          `La licencia del estudiante ${licencia.id_usuario} ha sido aprobada.`,
          licencia.id_profesor
        ],
        transaction: conn
      }
    );
  }

  console.log(`📜 Auditoría y notificaciones registradas para licencia ${licencia.id_licencia}`);
}


export async function decidirLicenciaSvc({
  idLicencia,
  decision,
  estado,
  motivo_rechazo,
  observacion,
  _fi,
  _ff,
  idFuncionario,
  idfuncionario,
  id_usuario,
  ip = '0.0.0.0' // ✅ IP recibida desde el controlador
}) {
  const DEC = (decision ?? estado ?? '').toLowerCase().trim();
  if (!['aceptado', 'rechazado'].includes(DEC)) {
    const e = new Error('DECISION_INVALIDA');
    e.http = 400;
    throw e;
  }

  const actorId = idFuncionario ?? idfuncionario ?? id_usuario ?? null;
  if (!actorId) {
    const e = new Error('REVISOR_REQUERIDO');
    e.http = 401;
    throw e;
  }

  const tx = await LicenciaMedica.sequelize.transaction();
  try {
    const lic = await LicenciaMedica.findByPk(idLicencia, {
      transaction: tx,
      lock: true,
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
      let archivo = null;
      try {
        archivo = await ArchivoLicencia.findOne({
          where: { id_licencia: lic.id_licencia, hash: { [Op.ne]: null } },
          transaction: tx,
        });
      } catch (_) {}

      if (!archivo) {
        const rows = await LicenciaMedica.sequelize.query(
          'SELECT 1 AS ok FROM archivolicencia WHERE id_licencia = ? AND hash IS NOT NULL LIMIT 1',
          {
            replacements: [lic.id_licencia],
            type: QueryTypes.SELECT,
            transaction: tx,
          }
        );
        if (!rows.length) {
          const e = new Error('No se puede aceptar sin archivo válido (hash)');
          e.http = 422;
          throw e;
        }
      }

      const fechaInicio = _fi ?? lic.fecha_inicio;
      const fechaFin = _ff ?? lic.fecha_fin;

      if (!fechaInicio || !fechaFin || new Date(fechaInicio) > new Date(fechaFin)) {
        const e = new Error('RANGO_FECHAS_INVALIDO');
        e.http = 422;
        throw e;
      }

      const solape = await LicenciaMedica.findOne({
        where: {
          id_usuario: lic.id_usuario,
          estado: 'aceptado',
          id_licencia: { [Op.ne]: lic.id_licencia },
          [Op.or]: [
            { fecha_inicio: { [Op.between]: [fechaInicio, fechaFin] } },
            { fecha_fin: { [Op.between]: [fechaInicio, fechaFin] } },
            {
              [Op.and]: [
                { fecha_inicio: { [Op.lte]: fechaInicio } },
                { fecha_fin: { [Op.gte]: fechaFin } },
              ],
            },
          ],
        },
        transaction: tx,
      });
      if (solape) {
        const e = new Error('SOLAPAMIENTO_CON_OTRA_ACEPTADA');
        e.http = 422;
        throw e;
      }

      lic.estado = 'aceptado';
      lic.fecha_inicio = fechaInicio;
      lic.fecha_fin = fechaFin;
      lic.motivo_rechazo = null;
      await lic.save({ transaction: tx });

      const cursos = await Matricula.findAll({
        where: { id_usuario: lic.id_usuario },
        attributes: ['id_curso'],
        transaction: tx
      });

      if (!cursos.length) {
        console.warn(`⚠️ Estudiante ${lic.id_usuario} no tiene cursos asociados.`);
      }

      for (const { id_curso } of cursos) {
        try {
          await LicenciasEntregas.findOrCreate({
            where: { id_licencia: lic.id_licencia, id_curso },
            transaction: tx
          });
          console.log(`✅ Entrega registrada: licencia ${lic.id_licencia}, curso ${id_curso}`);
        } catch (error) {
          console.error(`❌ Error al insertar entrega: ${error.message}`);
        }
      }


      await HistorialLicencias.create({
        id_licencia: lic.id_licencia,
        id_usuario: actorId,
        estado: 'aceptado',
        observacion: observacion ?? null,
        fecha_actualizacion: new Date(),
      }, { transaction: tx });

      console.log(`🔔 Ejecutando notificaciones para licencia ${lic.id_licencia}`);
      await registrarNotificacionesYAuditoria({
        licencia: lic,
        estado: DEC,
        motivo_rechazo,
        actorId,
        ip,
        conn: tx
      });

      await tx.commit();
      return { ok: true, estado: 'aceptado' };
    }

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
        id_usuario: actorId,
        estado: 'rechazado',
        observacion: lic.motivo_rechazo,
        fecha_actualizacion: new Date(),
      }, { transaction: tx });

      await registrarNotificacionesYAuditoria({
        licencia: lic,
        estado: DEC,
        motivo_rechazo,
        actorId,
        ip,
        conn: tx
      });

      await tx.commit();
      return { ok: true, estado: 'rechazado' };
    }

    const e = new Error('DECISION_DESCONOCIDA');
    e.http = 400;
    throw e;
  } catch (err) {
    await tx.rollback();
    throw err;
  }
}



async function insertarEntregasSiAceptado(idLicencia, idUsuario) {
  const cursos = await Matricula.findAll({
    where: { id_usuario: idUsuario },
    attributes: ['id_curso']
  });

  if (!cursos.length) {
    console.warn(`⚠️ Estudiante ${idUsuario} no tiene cursos asociados.`);
    return;
  }

  for (const { id_curso } of cursos) {
    try {
      await LicenciasEntregas.findOrCreate({
        where: { id_licencia: idLicencia, id_curso }
      });
      console.log(`✅ Entrega registrada: licencia ${idLicencia}, curso ${id_curso}`);
    } catch (error) {
      console.error(`❌ Error al insertar entrega: ${error.message}`);
    }
  }
}
