import mysql from 'mysql2/promise';
import { env } from './env.js'; // importa la configuración unificada

const db = mysql.createPool({
  host: env.db.host,
  user: env.db.user,
  password: env.db.pass,
  database: env.db.name,
  port: Number(env.db.port) || 3306,
  ssl: (process.env.DB_SSL || 'false').toString() === 'true'
    ? { rejectUnauthorized: true }
    : undefined,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default db;
