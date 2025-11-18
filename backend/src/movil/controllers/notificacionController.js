import * as NotificacionModel from "../models/notificacionModel.js";

export const getNotificaciones = async (req, res) => {
  try {
    const notificaciones = await NotificacionModel.getAllNotificaciones();
    res.json(notificaciones);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getNotificacionesUsuario = async (req, res) => {
  try {
    const notificaciones = await NotificacionModel.getNotificacionesByUsuario(req.params.id_usuario);
    res.json(notificaciones);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createNotificacion = async (req, res) => {
  try {
    const id = await NotificacionModel.createNotificacion(req.body);
    res.status(201).json({ message: "Notificación creada", id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};