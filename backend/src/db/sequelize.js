import 'dotenv/config';
import { Sequelize } from 'sequelize';

const sslEnabled = String(process.env.DB_SSL || 'false').toLowerCase() === 'true';

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    dialect: 'mysql',
    logging: false, // cambia a true si quieres ver las queries en consola
    pool: {
      max: 10,
      min: 0,
      acquire: 30000, // tiempo máx. esperando una conexión
      idle: 10000     // cierra conexiones ociosas a los 10s
    },
    dialectOptions: sslEnabled ? { ssl: { require: true } } : {}
  }
);

export default sequelize;
