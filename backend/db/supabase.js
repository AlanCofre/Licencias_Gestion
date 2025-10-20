import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fkzuecengvjsrchlppfu.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrenVlY2VuZ3Zqc3JjaGxwcGZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4Nzc0MjcsImV4cCI6MjA3NjQ1MzQyN30.8zWajiLD5fNTCX3FW0jTMhjFrpcCIEL7YLsFGArs2w4'
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
