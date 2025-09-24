// backend/src/middlewares/uploadLicencia.js  (ESM único para subir archivos)
import multer from 'multer';

// === Config por entorno ===
const MAX_MB = parseInt(process.env.UPLOAD_MAX_MB || '10', 10);

// Tipos permitidos (PDF/JPEG/PNG) + opcional HEIC/HEIF si se habilita por env
function defaultAllowed() {
  const base = ['application/pdf', 'image/jpeg', 'image/png'];
  if (String(process.env.UPLOAD_ALLOW_HEIC || '').toLowerCase() === 'true') {
    base.push('image/heic', 'image/heif');
  }
  return base;
}

// Factory por si necesitas variantes con límites distintos
export function createUpload({ maxMb = MAX_MB, allowed = defaultAllowed() } = {}) {
  const storage = multer.memoryStorage();
  return multer({
    storage,
    limits: { fileSize: maxMb * 1024 * 1024, files: 1 },
    fileFilter: (_req, file, cb) => {
      if (!allowed.includes(file.mimetype)) {
        return cb(new Error('Tipo de archivo no permitido (solo PDF/JPG/PNG)'));
      }
      cb(null, true);
    }
  });
}

// Instancia por defecto (equivalente a lo que ya usabas)
export const upload = createUpload();

// Middleware de manejo de errores de Multer (unificado)
export function handleMulterError(err, _req, res, next) {
  if (!err) return next();

  // Mensajes más claros según código de Multer
  const map = {
    LIMIT_FILE_SIZE: `El archivo supera el límite de ${MAX_MB} MB.`,
    LIMIT_FILE_COUNT: 'Demasiados archivos (solo 1 permitido).',
    LIMIT_UNEXPECTED_FILE: 'Campo de archivo inesperado.'
  };

  const mensaje = map[err.code] || err.message || 'Error al subir archivo';
  return res.status(400).json({
    ok: false,
    errores: [{ campo: 'archivo', mensaje }]
  });
}

export { MAX_MB };
export default { upload, handleMulterError, MAX_MB, createUpload };
