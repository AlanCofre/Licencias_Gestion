import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Resolver ruta absoluta a .env.local
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const envPath = path.resolve(__dirname, '../../.env.local')

// Cargar .env.local
dotenv.config({ path: envPath })

// Validación explícita
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Variables de entorno no cargadas')
  console.error('SUPABASE_URL:', process.env.SUPABASE_URL)
  console.error('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY)
  throw new Error('Faltan variables de entorno para Supabase')
}

// Inicializar cliente
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
