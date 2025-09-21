require('dotenv').config();
const { sequelize } = require('./models');
const app = require('./app');

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