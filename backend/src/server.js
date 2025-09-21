import app from './app.js';

console.log('[server] import app OK');   // <— log 1

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

server.on('error', (err) => {
  console.error('[server] error en listen:', err);
});