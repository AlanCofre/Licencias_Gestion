// backend/config/env.js
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 1) siempre carga el .env de la raíz del backend
const envPath = path.join(__dirname, '..', '.env')
dotenv.config({ path: envPath })

// 2) si te piden remoto, pisa con .env.dev
const useRemote =
  process.env.NODE_ENV === 'remote' ||
  process.env.USE_REMOTE_DB === 'true'

if (useRemote) {
  const devPath = path.join(__dirname, '..', '.env.dev')
  if (fs.existsSync(devPath)) {
    dotenv.config({ path: devPath, override: true })
    console.log('[ENV] usando .env.dev (remoto)')
  } else {
    console.warn('[ENV] se pidió remoto pero no existe .env.dev')
  }
}

// 3) opcional: exponer en objeto
export const env = {
  nodeEnv: process.env.NODE_ENV,
  port: process.env.PORT || process.env.APP_PORT || 3000,
  db: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    pass: process.env.DB_PASSWORD,
    name: process.env.DB_NAME,
    port: process.env.DB_PORT,
  },
}
