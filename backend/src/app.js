
import express from 'express';
import session from 'express-session';
import usuarioRoutes from './routes/usuario.route.js';
import healthRouter from './routes/health.route.js';
import licenciasRouter from './routes/licencias.route.js';
import dotenv from 'dotenv';
console.log('[app] init');               // <— log 2

import usuarioRoutes from './routes/usuario.route.js';
import licenciasRoutes from './routes/licencias.route.js';
import { serveStaticFolder } from '../middlewares/static_Serve.js';

dotenv.config();
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(healthRouter);
app.use(licenciasRouter);

// Middleware de sesión
app.use(session({
  secret: 'mi_secreto_seguro',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Rutas
app.use('/usuarios', usuarioRoutes);
app.use('/api/licencias', licenciasRoutes);

// Redirección base
app.get('/', (req, res) => res.redirect('/usuarios/login'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
console.log('[app] listo para exportar'); // <— log 3
export default app;