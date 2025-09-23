const express = require('express');
const multer = require('multer');
const path = require('path');

const UPLOAD_MAX_MB = parseInt(process.env.UPLOAD_MAX_MB || '5', 10);
const ALLOWED = (process.env.UPLOAD_ALLOWED_MIME || 'application/pdf,image/jpeg,image/png').split(',');

const upload = multer({
  limits: { fileSize: UPLOAD_MAX_MB * 1024 * 1024 },
  fileFilter: (_, file, cb) => ALLOWED.includes(file.mimetype) ? cb(null, true) : cb(new Error('TIPO_NO_PERMITIDO')),
});

const router = express.Router();
router.post('/licencias/:id/archivo', upload.single('file'), async (req, res) => {
  try {
    // aquí guardas a Firebase Storage o donde corresponda; req.file contiene buffer/info
    res.json({ ok: true });
  } catch (e) {
    if (e.message === 'TIPO_NO_PERMITIDO') {
      return res.status(415).json({ message: 'Tipo de archivo no permitido. Acepte PDF/JPG/PNG.' });
    }
    if (e.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: `El archivo supera el límite de ${UPLOAD_MAX_MB} MB.` });
    }
    res.status(500).json({ message: 'Error al subir el archivo' });
  }
});

module.exports = router;