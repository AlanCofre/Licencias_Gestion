import express from 'express';
import dotenv from 'dotenv';

console.log('[app] init');               // <— log 2

// Rutas
import usuarioRoutes from './routes/usuario.route.js';
import licenciasRoutes from './routes/licencias.route.js';

// Middlewares
import { serveStaticFolder } from '../middlewares/static_Serve.js';

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', serveStaticFolder('test'));

app.use('/usuarios', usuarioRoutes);
app.use('/api/licencias', licenciasRoutes);

console.log('[app] listo para exportar'); // <— log 3
export default app;
