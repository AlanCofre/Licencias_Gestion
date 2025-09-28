// backend/verifyToken.mjs
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' }); // asume backend/.env

const token = process.argv[2];
if (!token) {
  console.error('Uso: node verifyToken.mjs <TOKEN_SIN_BEARER>');
  process.exit(1);
}

try {
  const payload = jwt.verify(token, process.env.JWT_SECRET || 'no_secret');
  console.log('✅ Verificación OK — payload:');
  console.log(payload);
} catch (err) {
  console.error('❌ Verificación FALLIDA:', err.message);
  process.exit(2);
}
