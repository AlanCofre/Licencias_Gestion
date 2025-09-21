const express = require('express');
const app = express();

app.use(express.json());

const authRouter = require('./routes/auth');
app.use('/auth', authRouter);

const licenciasRouter = require('./routes/licenciamedica.routes');
app.use('/api/licencias', licenciasRouter);

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use((req, res) => res.status(404).json({ message: 'Not found' }));

module.exports = app;