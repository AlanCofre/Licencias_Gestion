import express from "express";
import * as NotificacionController from "../controllers/notificacionController.js";

const router = express.Router();

router.get("/", NotificacionController.getNotificaciones);
router.get("/usuario/:id_usuario", NotificacionController.getNotificacionesUsuario);
router.post("/", NotificacionController.createNotificacion);

export default router;