import express from 'express';
import cors from 'cors';
import detailsRouter from './detail/details.js';
import insertRouter from './insert/insert.js';
import notificacionesRouter from './routes/notificaciones.route.js';
import licenciasRouter from './routes/licencias.routes.js';
import healthRouter from './routes/health.route.js';
import usuarioRoutes from './routes/usuario.route.js';
import perfilRouter from './routes/perfil.routes.js';

import db from './../config/db.js';

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

/* === Rutas === */
app.use(healthRouter);

// ⚠️ Montar licencias SOLO una vez con prefijo fijo
//    → dentro de licencias.routes.js define rutas relativas (ej: router.patch('/:id/decision', ...))
app.use('/api/licencias', licenciasRouter);

// Resto de rutas existentes
app.use('/licencias', detailsRouter);        // legacy / vistas
app.use('/archivos', insertRouter);
app.use('/api/notificaciones', notificacionesRouter);
app.use('/usuarios', usuarioRoutes);
app.use('/api', perfilRouter);

// Home (debe ir antes del 404)
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

  try {
    const [rows] = await db.query('SELECT 1 + 1 AS ok');
    console.log('📡 Conexión a MySQL OK:', rows[0]);
  } catch (err) {
    console.error('❌ Error conectando a MySQL al iniciar:', err.message);
  }

});

export default app;
