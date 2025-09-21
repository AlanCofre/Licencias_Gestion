// src/routes/licenciamedica.routes.js
const express = require("express");
const router = express.Router();

const { validateLicenciaBody } = require("../middlewares/validateLicenciaMedica");
const { upload, handleMulterError, MAX_MB } = require("../middlewares/uploadArchivoLicencia");
const { LicenciaMedica } = require("../models"); // <- una sola vez

// Crear licencia
router.post(
  "/",
  upload.single("archivo"),
  handleMulterError,
  validateLicenciaBody,
  async (req, res) => {
    try {
      let archivo_url = null;
      // si luego subes a storage, acá setearías archivo_url

      const nueva = await LicenciaMedica.create({
        folio: req.validated.folio,
        fecha_emision: req.validated.fecha_emision || null,
        fecha_inicio: req.validated.fecha_inicio,
        fecha_fin: req.validated.fecha_fin,
        estado: req.validated.estado,
        motivo_rechazo: req.validated.motivo_rechazo ?? null,
        fecha_creacion: new Date(),
        id_usuario: req.validated.id_usuario,
        // archivo_url
      });

      return res.status(201).json({ ok: true, data: nueva });
    } catch (e) {
      console.error("[licenciamedica:create]", e);
      return res.status(500).json({ ok: false, mensaje: "Error interno" });
    }
  }
);

// Listado con filtros + paginación
router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || "10", 10)));
    const offset = (page - 1) * limit;

    const where = {};
    if (req.query.estado) where.estado = req.query.estado;
    if (req.query.id_usuario) where.id_usuario = req.query.id_usuario;

    const { count, rows } = await LicenciaMedica.findAndCountAll({
      where,
      order: [["fecha_creacion", "DESC"], ["id_licencia", "DESC"]],
      limit,
      offset
    });

    res.json({ ok: true, page, limit, total: count, data: rows });
  } catch (e) {
    console.error("[licenciamedica:list]", e);
    res.status(500).json({ ok: false, mensaje: "Error interno" });
  }
});

// Ping opcional
router.get("/ping", (req, res) => res.json({ ok: true, router: "licenciamedica" }));

module.exports = router;
