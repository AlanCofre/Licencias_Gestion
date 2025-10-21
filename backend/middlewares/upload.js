import multer from 'multer';

const storage = multer.memoryStorage();

function fileFilter(_req, file, cb) {
  // Aceptar sólo imágenes (png/jpg/jpeg/webp/gif opcional)
  if (!/^image\/(png|jpe?g|webp|gif)$/i.test(file.mimetype)) {
    return cb(new Error('Tipo de archivo no permitido. Sube una imagen.'));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
});

export default upload;
