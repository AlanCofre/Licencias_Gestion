const express = require('express');
const router = express.Router();
const { validateLicenseBody } = require('../middlewares/validateLicense');
const { upload, handleMulterError, MAX_MB } = require('../middlewares/uploadLicenseFile');
const { License } = require('../models'); // ajusta tu import
// const { subirAStorage } = require('../services/storage'); // tu helper Firebase

// Crear licencia (con archivo opcional)
router.post(
  "/",
  upload.single("archivo"),      // campo 'archivo' desde el frontend
  handleMulterError,
  validateLicenseBody,
  async (req, res) => {
    try {
      const data = req.validated;

      // Si requiere archivo y no vino ninguno:
      if (data.requiere_archivo && !req.file) {
        return res.status(400).json({
          ok:false,
          errores:[{ campo:"archivo", mensaje:`Debes adjuntar un archivo (máx ${MAX_MB}MB)` }]
        });
      }

      let archivoUrl = null;
      if (req.file) {
        // Sube a Firebase/Storage aquí. Ejemplo:
        // const pathPublico = `licencias/${data.studentId}/${Date.now()}_${req.file.originalname}`;
        // archivoUrl = await subirAStorage(pathPublico, req.file.buffer, req.file.mimetype);
      }

      // Persistir (fechas como Date -> Sequelize las guarda ok en DATE/DATEONLY)
      const nueva = await License.create({
        studentId: data.studentId,
        tipo: data.tipo,
        motivo: data.motivo,
        descripcion: data.descripcion,
        fecha_inicio: data.fecha_inicio,
        fecha_fin: data.fecha_fin,
        archivo_url: archivoUrl
      });

      return res.status(201).json({ ok:true, data:nueva });
    } catch (e) {
      console.error("[licenses:create] error:", e);
      return res.status(500).json({ ok:false, mensaje:"Error interno al crear la licencia" });
    }
  }
);

module.exports = router;
