// backend/src/routes/licenciaarchivo.route.js
import { Router } from 'express';
import multer from 'multer';
import db from '../../db/db.js'; // ajusta si tu DB está en otro lugar

const UPLOAD_MAX_MB = parseInt(process.env.UPLOAD_MAX_MB || '5', 10);
const ALLOWED = (process.env.UPLOAD_ALLOWED_MIME || 'application/pdf,image/jpeg,image/png').split(',');

const upload = multer({
  limits: { fileSize: UPLOAD_MAX_MB * 1024 * 1024 },
  fileFilter: (_, file, cb) => ALLOWED.includes(file.mimetype) ? cb(null, true) : cb(new Error('TIPO_NO_PERMITIDO')),
});

const router = Router();

router.post('/licencias/:id/archivo', upload.single('file'), async (req, res) => {
  try {
    const idLicencia = Number(req.params.id);
    const { ruta_url, tipo_mime, hash, tamano } = req.body;

    if (!idLicencia || !ruta_url || !tipo_mime || !hash || !tamano) {
      return res.status(400).json({ ok: false, mensaje: 'Faltan datos obligatorios para registrar archivo' });
    }

    await db.execute(`
      INSERT INTO ArchivoLicencia
        (id_licencia, ruta_url, tipo_mime, hash, tamano, fecha_subida)
      VALUES (?, ?, ?, ?, ?, CURDATE())
    `, [idLicencia, ruta_url, tipo_mime, hash, tamano]);

    console.log(`[AUDITORÍA] Archivo registrado para licencia ${idLicencia} → ${ruta_url}`);

    return res.status(201).json({
      ok: true,
      mensaje: 'Archivo registrado correctamente'
    });
  } catch (e) {
    if (e.message === 'TIPO_NO_PERMITIDO') {
      return res.status(415).json({ message: 'Tipo de archivo no permitido. Acepte PDF/JPG/PNG.' });
    }
    if (e.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: `El archivo supera el límite de ${UPLOAD_MAX_MB} MB.` });
    }
    console.error('❌ Error al registrar archivo:', e);
    res.status(500).json({ message: 'Error al subir el archivo' });
  }
});

export default router;
