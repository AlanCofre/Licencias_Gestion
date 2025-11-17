import crypto from "crypto";
import { Op, QueryTypes } from "sequelize";

import LicenciaMedica from "../src/models/modelo_LicenciaMedica.js";
import HistorialLicencias from "../src/models/modelo_HistorialLicencias.js";
import ArchivoLicencia from "../src/models/modelo_ArchivoLicencia.js";
import { Matricula, LicenciasEntregas } from "../src/models/index.js";

import {
  notificarEstadoLicenciaEstudiante,
  notificarLicenciaCreadaEstudiante,
  notificarLicenciaAceptadaProfesor,
} from "./servicio_Correo.js";

/* =======================================================
 * Utilidades básicas
 * ======================================================= */
export function sha256FromBuffer(buf) {
  const h = crypto.createHash("sha256");
  h.update(buf);
  return h.digest("hex");
}

/* =======================================================
 * Validación de fechas y duplicados (sin logs)
 * ======================================================= */
export async function validarNuevaLicencia({
  idUsuario,
  fechaInicio,
  fechaFin,
  hashArchivoSha256,
}) {
  const licSolapada = await LicenciaMedica.findOne({
    where: {
      id_usuario: idUsuario,
      estado: { [Op.in]: ["pendiente", "aceptado"] },
      [Op.and]: [
        { fecha_inicio: { [Op.lte]: fechaFin } },
        { fecha_fin: { [Op.gte]: fechaInicio } },
      ],
    },
    attributes: ["id_licencia", "fecha_inicio", "fecha_fin", "estado"],
  });

  if (licSolapada) {
    const e = new Error("LICENCIA_FECHAS_SUPERPUESTAS");
    e.http = 409;
    throw e;
  }

  if (hashArchivoSha256) {
    const archivoPrevio = await ArchivoLicencia.findOne({
      where: { hash: hashArchivoSha256 },
      include: [
        {
          model: LicenciaMedica,
          as: "licencia",
          required: true,
          where: { id_usuario: idUsuario },
          attributes: ["id_licencia"],
        },
      ],
      attributes: ["id_archivo", "hash"],
    });

    if (archivoPrevio) {
      const e = new Error("ARCHIVO_HASH_DUPLICADO");
      e.http = 409;
      throw e;
    }
  }
}

/* =======================================================
 * Crear licencia con archivo (sin logs internos)
 * ======================================================= */
export async function crearLicenciaConArchivo({
  idUsuario,
  fechaInicio,
  fechaFin,
  motivo,
  archivoBuffer,
  archivoHashHex,
  archivoUrl,
  archivoMime,
  archivoBytes,
}) {
  const hash =
    archivoHashHex ??
    (archivoBuffer ? sha256FromBuffer(archivoBuffer) : null);

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
        estado: "pendiente",
      },
      { transaction: tx }
    );

    if (hash || archivoUrl || archivoMime || typeof archivoBytes === "number") {
      await ArchivoLicencia.create(
        {
          id_licencia: lic.id_licencia,
          hash: hash ?? null,
          ruta_url: archivoUrl ?? "local://sin-url",
          tipo_mime: archivoMime ?? "application/octet-stream",
          tamano:
            typeof archivoBytes === "number"
              ? archivoBytes
              : archivoBuffer?.length ?? 0,
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
 * AUXILIAR: envío de correo (silencioso)
 * ======================================================= */
async function enviarNotificacionCorreo({
  licencia,
  estado,
  motivo_rechazo,
  observacion,
}) {
  try {
    const [estRow] = await LicenciaMedica.sequelize.query(
      `SELECT correo_usuario, nombre
       FROM usuario WHERE id_usuario = ?
       LIMIT 1`,
      {
        replacements: [licencia.id_usuario],
        type: QueryTypes.SELECT,
      }
    );

    if (!estRow?.correo_usuario) return;

    await notificarEstadoLicenciaEstudiante({
      to: estRow.correo_usuario,
      folio: licencia.folio,
      estudianteNombre: estRow.nombre,
      estado,
      motivo_rechazo,
      fechaInicio: licencia.fecha_inicio,
      fechaFin: licencia.fecha_fin,
      observacion,
      enlaceDetalle: `${process.env.APP_URL}/mis-licencias/${licencia.id_licencia}`,
    });
  } catch (_) {}
}

/* =======================================================
 * AUXILIAR: notificar profesores aceptación
 * ======================================================= */
async function enviarNotificacionProfesores({ licencia }) {
  try {
    const [estRow] = await LicenciaMedica.sequelize.query(
      `SELECT nombre FROM usuario WHERE id_usuario = ? LIMIT 1`,
      {
        replacements: [licencia.id_usuario],
        type: QueryTypes.SELECT,
      }
    );

    if (!estRow) return;

    const cursosProfesores = await LicenciaMedica.sequelize.query(
      `SELECT 
        le.id_curso,
        c.nombre_curso,
        u.correo_usuario,
        u.nombre AS nombre_profesor
       FROM licencias_entregas le
       JOIN curso c ON le.id_curso = c.id_curso
       JOIN usuario u ON c.id_usuario = u.id_usuario
       WHERE le.id_licencia = ?`,
      {
        replacements: [licencia.id_licencia],
        type: QueryTypes.SELECT,
      }
    );

    if (!Array.isArray(cursosProfesores) || cursosProfesores.length === 0)
      return;

    for (const curso of cursosProfesores) {
      if (!curso.correo_usuario) continue;

      await notificarLicenciaAceptadaProfesor({
        to: curso.correo_usuario,
        folio: licencia.folio,
        estudianteNombre: estRow.nombre,
        nombreCurso: curso.nombre_curso,
        fechaInicio: licencia.fecha_inicio,
        fechaFin: licencia.fecha_fin,
        enlaceDetalle: `${process.env.APP_URL}/mis-cursos`,
      });
    }
  } catch (_) {}
}

/* =======================================================
 * Auditoría + notificaciones internas
 * ======================================================= */
async function registrarNotificacionesYAuditoria({
  licencia,
  estado,
  motivo_rechazo,
  actorId,
  ip = "0.0.0.0",
  conn,
}) {
  await conn.sequelize.query(
    `INSERT INTO logauditoria (accion, recurso, payload, ip, fecha, id_usuario)
     VALUES (?, ?, ?, ?, NOW(), ?)`,
    {
      replacements: [
        "cambiar estado",
        "licenciamedica",
        JSON.stringify({
          id_licencia: licencia.id_licencia,
          estado_anterior: licencia.estado,
          estado_nuevo: estado,
        }),
        ip,
        actorId,
      ],
      transaction: conn,
    }
  );

  // Notificación interna al estudiante
  await conn.sequelize.query(
    `INSERT INTO notificacion (asunto, contenido, leido, fecha_envio, id_usuario)
     VALUES (?, ?, 0, NOW(), ?)`,
    {
      replacements: [
        `Licencia ${estado}`,
        estado === "rechazado"
          ? "Tu licencia ha sido rechazada"
          : "Tu licencia ha sido aprobada",
        licencia.id_usuario,
      ],
      transaction: conn,
    }
  );
}

/* =======================================================
 * DECIDIR LICENCIA — SOLO 1 LOG FINAL POR PROCESO
 * ======================================================= */
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
  ip = "0.0.0.0",
}) {
  const DEC = (decision ?? estado ?? "").toLowerCase().trim();
  if (!["aceptado", "rechazado"].includes(DEC)) {
    const e = new Error("DECISION_INVALIDA");
    e.http = 400;
    throw e;
  }

  const actorId = idFuncionario ?? idfuncionario ?? id_usuario;
  if (!actorId) {
    const e = new Error("REVISOR_REQUERIDO");
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
      const e = new Error("LICENCIA_NO_ENCONTRADA");
      e.http = 404;
      throw e;
    }

    const estadoActual = String(lic.estado).toLowerCase();
    if (["aceptado", "rechazado"].includes(estadoActual)) {
      const e = new Error(`La licencia ya fue ${estadoActual}`);
      e.http = 409;
      throw e;
    }
    if (estadoActual !== "pendiente") {
      const e = new Error("ESTADO_NO_PERMITE_DECIDIR");
      e.http = 409;
      throw e;
    }

    // ================================
    //   PROCESO: ACEPTADO
    // ================================
    if (DEC === "aceptado") {
      const archivo = await ArchivoLicencia.findOne({
        where: { id_licencia: lic.id_licencia, hash: { [Op.ne]: null } },
        transaction: tx,
      });

      if (!archivo) {
        const rows = await LicenciaMedica.sequelize.query(
          "SELECT 1 FROM archivolicencia WHERE id_licencia = ? AND hash IS NOT NULL LIMIT 1",
          {
            replacements: [lic.id_licencia],
            type: QueryTypes.SELECT,
            transaction: tx,
          }
        );
        if (!rows.length) {
          const e = new Error("LICENCIA_SIN_HASH");
          e.http = 422;
          throw e;
        }
      }

      const fechaInicio = _fi ?? lic.fecha_inicio;
      const fechaFin = _ff ?? lic.fecha_fin;

      if (!fechaInicio || !fechaFin || new Date(fechaInicio) > new Date(fechaFin)) {
        const e = new Error("RANGO_FECHAS_INVALIDO");
        e.http = 422;
        throw e;
      }

      const solape = await LicenciaMedica.findOne({
        where: {
          id_usuario: lic.id_usuario,
          estado: "aceptado",
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
        const e = new Error("SOLAPAMIENTO_CON_OTRA_ACEPTADA");
        e.http = 422;
        throw e;
      }

      // Actualizar licencia
      lic.estado = "aceptado";
      lic.fecha_inicio = fechaInicio;
      lic.fecha_fin = fechaFin;
      lic.motivo_rechazo = null;
      await lic.save({ transaction: tx });

      // Registrar entregas
      const cursos = await Matricula.findAll({
        where: { id_usuario: lic.id_usuario },
        attributes: ["id_curso"],
        transaction: tx,
      });

      for (const { id_curso } of cursos) {
        await LicenciasEntregas.findOrCreate({
          where: { id_licencia: lic.id_licencia, id_curso },
          transaction: tx,
        });
      }

      // Auditoría + notificaciones internas
      await registrarNotificacionesYAuditoria({
        licencia: lic,
        estado: "aceptado",
        motivo_rechazo,
        actorId,
        ip,
        conn: tx,
      });

      await HistorialLicencias.create(
        {
          id_licencia: lic.id_licencia,
          id_usuario: actorId,
          estado: "aceptado",
          observacion,
          fecha_actualizacion: new Date(),
        },
        { transaction: tx }
      );

      await tx.commit();

      // Envíos fuera de transacción (silenciosos)
      enviarNotificacionCorreo({
        licencia: lic,
        estado: "aceptado",
        motivo_rechazo: null,
        observacion,
      });
      enviarNotificacionProfesores({ licencia: lic });

      // 🔥 LOG FINAL — ÚNICO
      console.log(`[Licencias] Licencia ${lic.id_licencia} aceptada correctamente.`);

      return { ok: true, estado: "aceptado" };
    }

    // ================================
    //   PROCESO: RECHAZADO
    // ================================
    if (DEC === "rechazado") {
      if (!motivo_rechazo || !String(motivo_rechazo).trim()) {
        const e = new Error("MOTIVO_RECHAZO_REQUERIDO");
        e.http = 400;
        throw e;
      }

      // Actualizar licencia
      lic.estado = "rechazado";
      lic.motivo_rechazo = String(motivo_rechazo).trim();
      await lic.save({ transaction: tx });

      // Auditoría + notificaciones internas
      await registrarNotificacionesYAuditoria({
        licencia: lic,
        estado: "rechazado",
        motivo_rechazo,
        actorId,
        ip,
        conn: tx,
      });

      await HistorialLicencias.create(
        {
          id_licencia: lic.id_licencia,
          id_usuario: actorId,
          estado: "rechazado",
          observacion: lic.motivo_rechazo,
          fecha_actualizacion: new Date(),
        },
        { transaction: tx }
      );

      await tx.commit();

      // Correo externo (silencioso)
      enviarNotificacionCorreo({
        licencia: lic,
        estado: "rechazado",
        motivo_rechazo: lic.motivo_rechazo,
        observacion,
      });

      // 🔥 LOG FINAL — ÚNICO
      console.log(`[Licencias] Licencia ${lic.id_licencia} rechazada correctamente.`);

      return { ok: true, estado: "rechazado" };
    }

    // Fallback (no debería ocurrir)
    const e = new Error("DECISION_DESCONOCIDA");
    e.http = 400;
    throw e;
  } catch (err) {
    await tx.rollback();

    // 🔥 LOG DE ERROR — ÚNICO
    console.error(
      `[Licencias] Error procesando licencia ${idLicencia}: ${err.message}`
    );

    throw err;
  }
}

/* =======================================================
 * Exportación final
 * ======================================================= */
export default {
  validarNuevaLicencia,
  crearLicenciaConArchivo,
  decidirLicenciaSvc,
};
