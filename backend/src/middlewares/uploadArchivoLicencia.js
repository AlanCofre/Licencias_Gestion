// npm i multer
const multer = require("multer");
const storage = multer.memoryStorage();

const MAX_MB = 10;
const upload = multer({
  storage,
  limits: { fileSize: MAX_MB * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    const allowed = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Tipo de archivo no permitido (PDF/JPG/PNG)"));
    }
    cb(null, true);
  }
});

function handleMulterError(err, req, res, next) {
  if (err) {
    return res.status(400).json({
      ok:false,
      errores:[{ campo:"archivo", mensaje: err.message || "Error al subir archivo" }]
    });
  }
  next();
}

module.exports = { upload, handleMulterError, MAX_MB };
