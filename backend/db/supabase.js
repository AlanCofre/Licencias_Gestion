import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://irelirvxrgvpbfndxcjv.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyZWxpcnZ4cmd2cGJmbmR4Y2p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2OTU3MjUsImV4cCI6MjA3NjI3MTcyNX0.F65hs0TZq52dSApC9Qaj46fSlX-nOP4koCb5c8M8C9U'
export const supabase = createClient(supabaseUrl, supabaseKey)



// ejemplo subir un archivo
import { supabase } from './supabaseClient'

const archivo = event.target.files[0] // input type="file"
const { data, error } = await supabase.storage
  .from('archivos')
  .upload(`usuario123/${archivo.name}`, archivo)

if (error) {
  console.error('Error al subir:', error.message)
} else {
  console.log('Archivo subido:', data)
}

const { signedUrl } = await supabase.storage
  .from('archivos')
  .createSignedUrl('usuario123/miarchivo.pdf', 60) // 60 segundos

console.log('URL firmada:', signedUrl)
