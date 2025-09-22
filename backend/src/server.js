// src/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Routers (CommonJS: module.exports = router)
const detailsRouter = require('./detail/details');
const insertRouter = require('./insert/insert');
const notificationRouter = require('./notification/notificacion');
const licenciaRoutes = require('./routes/licencia.routes');
const archivoRoutes  = require('./routes/archivo.routes');

// Conexión a la base de datos (pool mysql2/promise)
const db = require('./db/db');

const app = express();
const PORT = process.env.PORT || 3000;

/* === Middlewares globales === */
app.use(cors());
app.use(express.json());

/* === Rutas === */
// REST principal de licencias (endpoint nuevo: POST /api/licencias)
app.use('/api/licencias', licenciaRoutes);

// Rutas auxiliares que ya tenías
app.use('/licencias', detailsRouter);
app.use('/archivos', insertRouter);
app.use('/notificaciones', notificationRouter);
app.use('/api/archivos', archivoRoutes);

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

  // Precarga de licencias (usa el nombre real de la tabla: LicenciaMedica)
  try {
    const [licencias] = await db.execute(
      'SELECT * FROM LicenciaMedica ORDER BY fecha_emision DESC LIMIT 5'
    );
    console.log('📦 Licencias precargadas al iniciar:', licencias);
  } catch (err) {
    console.error('❌ Error al precargar licencias:', err.message);
  }
});
