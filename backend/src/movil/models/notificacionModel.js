import db from "../../../config/db.js";

export const getAllNotificaciones = async () => {
  const [rows] = await db.query("SELECT * FROM notificacion");
  return rows;
};

export const getNotificacionesByUsuario = async (id_usuario) => {
  const [rows] = await db.query("SELECT * FROM notificacion WHERE id_usuario = ?", [id_usuario]);
  return rows;
};

export const createNotificacion = async (notificacion) => {
  const { asunto, contenido, id_usuario } = notificacion;
  const [result] = await db.query(
    "INSERT INTO notificacion (asunto, contenido, fecha_envio, id_usuario) VALUES (?, ?, NOW(), ?)",
    [asunto, contenido, id_usuario]
  );
  return result.insertId;
};