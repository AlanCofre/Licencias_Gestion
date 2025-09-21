import 'dotenv/config';
import app from './app.js';
import sequelize from './db/sequelize.js';

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión inicial a MySQL OK');
    // En desarrollo podrías sincronizar:
    // await sequelize.sync({ alter: true });
  } catch (error) {
    console.error('❌ Falló la conexión inicial a MySQL:', error);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  });
}

start();
