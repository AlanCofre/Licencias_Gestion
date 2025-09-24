require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    dialect: 'mysql',
    logging: false,
  }
);

(async () => {
  try {
    await sequelize.authenticate();
    const [rows] = await sequelize.query('SELECT 1 AS ok');
    console.log('✅ Conexión OK:', rows);
    process.exit(0);
  } catch (e) {
    console.error('❌ Falló conexión:', e.message);
    process.exit(1);
  }
})();