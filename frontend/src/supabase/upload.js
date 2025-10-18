// Subir archivo
const uploadFile = async (file, path) => {
  const { data, error } = await supabase.storage
    .from('licencias')
    .upload(path, file, { upsert: true })
  return { data, error }
}

// Obtener URL pública
const getPublicUrl = (path) => {
  const { data } = supabase.storage.from('licencias').getPublicUrl(path)
  return data.publicUrl
}
