// npm i multer
const multer = require('multer');

// Al disco temporal (o memoria) — si luego subes a Firebase, usa memoria:
const storage = multer.memoryStorage();

// Límite de 10 MB (ajústalo)
const MAX_MB = 10;
const upload = multer({
  storage,
  limits: { fileSize: MAX_MB * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    // Tipos aceptados: PDF/JPG/PNG (ajusta a tu política)
    const allowed = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      // si tu móvil manda HEIC:
      // "image/heic", "image/heif"
    ];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Tipo de archivo no permitido (solo PDF/JPG/PNG)"));
    }
    cb(null, true);
  }
});

// Middleware para manejar el error bonito
function handleMulterError(err, req, res, next) {
  if (err) {
    return res.status(400).json({
      ok:false,
      errores: [{ campo: "archivo", mensaje: err.message || "Error al subir archivo" }]
    });
  }
  next();
}

module.exports = { upload, handleMulterError, MAX_MB };
