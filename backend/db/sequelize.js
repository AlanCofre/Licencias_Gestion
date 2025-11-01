import 'dotenv/config';
import { Sequelize, DataTypes } from 'sequelize';

const sslEnabled = String(process.env.DB_SSL || 'false').toLowerCase() === 'true';

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    dialect: 'mysql',
    logging: false,
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
    dialectOptions: sslEnabled ? { ssl: { require: true } } : {}
  }
);

export { sequelize, DataTypes }; // ✅ exporta ambos

