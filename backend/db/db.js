
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
dotenv.config();

const db = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || process.env.DB_PASS || '',
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3306,
  ssl: (process.env.DB_SSL || 'false').toString() === 'true' ? { rejectUnauthorized: true } : undefined,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});


export default db;