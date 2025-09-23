
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Middleware para servir un archivo estático desde views/
 * @param {string} fileName - Nombre del archivo a servir
 */
export function serveView(fileName) {
  return (req, res, next) => {
    const folderPath = path.join(__dirname, '../../frontend', 'public');
    res.sendFile(path.join(folderPath, fileName), err => {
      if (err) next(err);
    });
  };
}
