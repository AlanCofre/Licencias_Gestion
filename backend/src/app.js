import express from 'express';
import cors from 'cors';
import detailsRouter from './detail/details.js';
import insertRouter from './insert/insert.js';
import notificationRouter from './notification/notificacion.js';
import licenciasRouter from './routes/licencias.routes.js';
import db from './../config/db.js';
import healthRouter from './routes/health.route.js';
import usuarioRoutes from './routes/usuario.route.js';

// === Perfil === (NUEVO)
import perfilRouter from './routes/perfil.routes.js';

// Pool de mysql2/promise exportado desde ./db/db.js
// (si tu módulo exporta `module.exports = pool`, esto sigue funcionando como default en ESM)
// === App + Config ===
const app = express();
const PORT = process.env.PORT || 3000;
console.log('[env] JWT_SECRET set?', !!process.env.JWT_SECRET);
console.log('[DB CONFIG]', {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

/* === Middlewares globales === */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(healthRouter);
app.use(licenciasRouter);

/* === Rutas === */
// REST principal de licencias (endpoint nuevo: POST /api/licencias)
app.use('/api/licencias', licenciasRouter);

// Rutas auxiliares que ya tenías
app.use('/licencias', detailsRouter);
app.use('/archivos', insertRouter);
app.use('/notificaciones', notificationRouter);
app.use('/usuarios', usuarioRoutes);
app.use('/api', licenciasRouter);

// === Perfil === (NUEVO) → expone /api/perfil/me, /api/perfil/usuario/:id_usuario
app.use('/api', perfilRouter);

/* === 404 (no encontrado) === */
app.use((req, res) => {
  res.status(404).json({ ok: false, mensaje: 'Ruta no encontrada' });
});

/* === Error handler global === */
app.use((err, req, res, next) => {
  console.error('💥 Error no controlado:', err);
  res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
});
app.get('/', (req, res) => res.redirect('/usuarios/login'));

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

export default app;
