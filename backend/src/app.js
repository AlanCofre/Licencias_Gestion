import express from 'express';
import healthRouter from './routes/health.route.js';
import licenciasRouter from './routes/licencias.route.js';

const app = express();
app.use(express.json());
app.use(healthRouter);
app.use(licenciasRouter);

export default app;
