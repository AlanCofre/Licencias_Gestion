// backend/genToken.mjs  (ESM — ejecuta con "node genToken.mjs")
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' }); // asume backend/.env

const id = Number(process.argv[2] || '8');        // primer argumento: id_usuario
const rol = process.argv[3] || 'estudiante';     // segundo argumento: rol (string)

// Ajusta expiración si quieres
const EXPIRES = process.env.JWT_EXPIRES_IN || '4h';
const SECRET = process.env.JWT_SECRET || 'dev_jwt_secret';

const token = jwt.sign({ id, rol }, SECRET, { expiresIn: EXPIRES });
console.log('Bearer ' + token);
