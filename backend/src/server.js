// src/server.js
require('dotenv').config();
const express = require('express');
const { sequelize } = require('./models');

const app = express();

// si usas rate-limit detrás de proxy (nginx), activa esto
app.set('trust proxy', 1);

// body parser
app.use(express.json());

// rutas
const authRouter = require('./routes/auth');
app.use('/auth', authRouter);

// healthcheck
app.get('/health', (_req, res) => res.json({ ok: true }));

// 404
app.use((req, res) => res.status(404).json({ message: 'Not found' }));

// handler de errores
app.use((err, _req, res, _next) => {
  console.error('💥', err);
  res.status(500).json({ message: 'Error interno' });
});

// probar DB y arrancar
(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ DB conectada');
  } catch (err) {
    console.error('❌ Error conectando DB:', err.message);
    process.exit(1);
  }
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`🚀 API lista: http://localhost:${PORT}`));
})();
