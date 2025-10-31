// backend/src/app.js
import '../config/env.js'
import express from 'express';
import cors from 'cors';
import detailsRouter from './detail/details.js';
import insertRouter from './insert/insert.js';
import notificacionesRouter from './routes/notificaciones.route.js';
import licenciasRouter from './routes/licencias.routes.js';
import healthRouter from './routes/health.route.js';
import usuarioRoutes from './routes/usuario.route.js';
import perfilRouter from './routes/perfil.routes.js';
import devMailRoutes from './routes/dev.mail.routes.js';
import archivoRoutes from './routes/archivo.routes.js'; // ✅ Asegúrate de importar esto
import { attachAudit } from '../middlewares/audit.middleware.js';
import db from './../config/db.js';

const app = express();                // ← declara app ANTES de usarla
const PORT = process.env.PORT || 3000;

console.log('[env] JWT_SECRET set?', !!process.env.JWT_SECRET);
console.log('[DB CONFIG]', {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

/* === Configuración CORS mejorada === */
const corsOptions = {
  origin: ['http://127.0.0.1:5500', 'http://localhost:5500', 'http://localhost:3000', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Middleware para manejar preflight requests
app.options('*', cors(corsOptions));

/* === Middlewares globales === */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* === Rutas de DEV (solo en desarrollo) === */
if (process.env.NODE_ENV !== "production") {
  app.use(express.json());
  app.use(attachAudit());
  app.use(devMailRoutes); // aquí ya existe app
}

/* === Rutas === */
app.use(healthRouter);

// ✅ Montar rutas de archivos
app.use('/api/archivos', archivoRoutes);

// ⚠️ Montar licencias SOLO una vez con prefijo fijo
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