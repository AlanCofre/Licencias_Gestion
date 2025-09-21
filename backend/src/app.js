import express from 'express';
import healthRouter from './routes/health.route.js';
import licenciasRouter from './routes/licencias.route.js';
import dotenv from 'dotenv';
import usuarioRoutes from './routes/ruta_Usuario.js';
import { serveStaticFolder } from '../middlewares/static_Serve.js';

dotenv.config();
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(healthRouter);
app.use(licenciasRouter);
app.get('/', serveStaticFolder('test'));
// Rutas de usuario
app.use('/usuarios', usuarioRoutes);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
export default app;