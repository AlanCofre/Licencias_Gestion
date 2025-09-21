const express = require("express");
const router = express.Router();

const { validateLicenciaBody } = require("../middlewares/validateLicenciaMedica");
const { upload, handleMulterError, MAX_MB } = require("../middlewares/uploadArchivoLicencia");
const { LicenciaMedica } = require("../models"); // ajusta a tu index de modelos
// const { subirAStorage } = require("../services/storage"); // si usas Firebase/otro

router.post(
  "/",
  upload.single("archivo"),   // el frontend envía campo 'archivo'
  handleMulterError,
  validateLicenciaBody,
  async (req, res) => {
    try {
      // si quieres exigir archivo al crear, valida aquí:
      // if (!req.file) return res.status(400).json({ ok:false, errores:[{campo:"archivo", mensaje:`Debes adjuntar archivo (máx ${MAX_MB}MB)`}] });

      let archivo_url = null;
      if (req.file) {
        // ejemplo:
        // const path = `licencias/${req.validated.id_usuario}/${Date.now()}_${req.file.originalname}`;
        // archivo_url = await subirAStorage(path, req.file.buffer, req.file.mimetype);
      }

      const nueva = await LicenciaMedica.create({
        // columnas reales en tu tabla:
        folio: req.validated.folio,
        fecha_emision: req.validated.fecha_emision || null,
        fecha_inicio: req.validated.fecha_inicio,
        fecha_fin: req.validated.fecha_fin,
        estado: req.validated.estado,                 // "Pendiente" por defecto
        motivo_rechazo: req.validated.motivo_rechazo ?? null,
        fecha_creacion: new Date(),                   // si tu tabla no lo autogenera
        id_usuario: req.validated.id_usuario,
        // si decides guardar URL del archivo, agrega columna en BD (p. ej. archivo_url)
        // archivo_url
      });

      return res.status(201).json({ ok:true, data:nueva });
    } catch (e) {
      console.error("[licenciamedica:create]", e);
      return res.status(500).json({ ok:false, mensaje:"Error interno" });
    }
  }
);

module.exports = router;
