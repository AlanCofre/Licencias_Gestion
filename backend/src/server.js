// backend/src/server.js
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Cargar backend/.env desde src/
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import app from './app.js';

console.log('[env] JWT_SECRET set?', !!process.env.JWT_SECRET);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
