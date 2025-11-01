// backend/src/server.js (ESM)

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import express from 'express';
import cors from 'cors';

// === Cargar backend/.env desde src/ ===
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// === Imports de routers y db (ESM) ===
import detailsRouter from './detail/details.js';
import insertRouter from './insert/insert.js';
import notificationRouter from './notification/notificacion.js';
import licenciaRoutes from './routes/licencias.routes.js';
import notificarEstado from './routes/licencias.routes.js';
import archivoRoutes from './routes/archivo.routes.js';
import usuarioRoutes from './routes/usuario.route.js';

// Pool de mysql2/promise exportado desde ./db/db.js
import db from '../db/db.js';

// === App + Config ===
const app = express();
const PORT = process.env.PORT || 3000;

console.log('[env] JWT_SECRET set?', !!process.env.JWT_SECRET);

/* === Middlewares globales === */
app.use(cors({
  origin: 'http://127.0.0.1:5500', // Live Server frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

/* === Rutas === */
app.use('/usuarios', usuarioRoutes);
app.use('/api/licencias', licenciaRoutes);
app.use('/api/archivos', archivoRoutes);
app.use('/licencias', detailsRouter);
app.use('/archivos', insertRouter);
app.use('/notificaciones', notificationRouter);
app.get('/', (req, res) => res.redirect('/usuarios/login'));

/* === 404 (no encontrado) === */
app.use((req, res) => {
  res.status(404).json({ ok: false, mensaje: 'Ruta no encontrada' });
});

/* === Error handler global === */
app.use((err, req, res, next) => {
  console.error('💥 Error no controlado:', err);
  res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
});

/* === Arranque del servidor === */
app.listen(PORT, async () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);

  // Ping a la BD
  try {
    const [rows] = await db.query('SELECT 1 + 1 AS ok');
    console.log('📡 Conexión a MySQL OK:', rows[0]);
  } catch (err) {
    console.error('❌ Error conectando a MySQL al iniciar:', err.message);
  }

  // Precarga de licencias
  try {
    const [licencias] = await db.execute(
      'SELECT * FROM LicenciaMedica ORDER BY fecha_emision DESC LIMIT 5'
    );
    console.log('📦 Licencias precargadas al iniciar:', licencias);
  } catch (err) {
    console.error('❌ Error al precargar licencias:', err.message);
  }
});

export default app;
