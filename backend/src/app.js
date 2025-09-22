import express from 'express';
import session from 'express-session';
import dotenv from 'dotenv';
import usuarioRoutes from './routes/usuario.route.js';
import healthRouter from './routes/health.route.js';
import licenciasRoutes from './routes/licencias.route.js';
import { serveView } from '../middlewares/static_Serve.js';

console.log('[app] init');               // <— log 2

dotenv.config();
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de sesión (antes de las rutas que lo usan)
app.use(session({
  secret: 'mi_secreto_seguro',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Rutas
app.use(healthRouter);
app.use('/usuarios', usuarioRoutes);
app.use('/api/licencias', licenciasRoutes);

// Redirección base
app.get('/', (req, res) => res.redirect('/usuarios/login'));

// NO llamar app.listen() aquí — dejar que server.js arranque el servidor
export default app;
console.log('[app] listo para exportar'); // <— log 3