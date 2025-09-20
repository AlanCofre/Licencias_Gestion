import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Middleware para servir archivos estáticos desde cualquier carpeta
 * @param {string} folderName - Nombre de la carpeta a servir
 */
export function serveStaticFolder(folderName) {
  return (req, res, next) => {
    const folderPath = path.join(__dirname, '..', folderName);
    res.sendFile(path.join(folderPath, 'index.html'), err => {
      if (err) next();
    });
  };
}
