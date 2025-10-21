// backend/src/routes/archivo.routes.js
import { Router } from 'express'
import requireAuth from '../../middlewares/requireAuth.js'
import ctrl from '../../controllers/archivo.controller.js'
import pool from '../../db/db.js'
import { supabase } from '../supabase/supabaseClient.js'
import multer from 'multer'

const router = Router()
const upload = multer()

// POST /api/archivos → Registrar un archivo
router.post('/', requireAuth, ctrl.registrarArchivo)

// GET /api/archivos/licencia/:id → Listar archivos de una licencia
router.get('/licencia/:id', requireAuth, async (req, res) => {
  try {
    const idLicencia = req.params.id
    const [rows] = await pool.execute(
      'SELECT * FROM ArchivoLicencia WHERE id_licencia = ?',
      [idLicencia]
    )
    return res.json({ ok: true, data: rows })
  } catch (e) {
    console.error('❌ Error obteniendo archivos:', e)
    return res.status(500).json({
      ok: false,
      mensaje: 'Error obteniendo archivos',
      detalle: e.message
    })
  }
})

// POST /api/archivos/subir → Subir archivo real al bucket 'licencias'
router.post('/subir', requireAuth, upload.single('archivo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, mensaje: 'Archivo no recibido' })
    }

    const id_usuario = req.user?.id_usuario
    if (!id_usuario) {
      return res.status(401).json({ ok: false, mensaje: 'Usuario no autenticado' })
    }

    const buffer = req.file.buffer
    const nombreArchivo = req.file.originalname
    const path = `${id_usuario}/${Date.now()}_${nombreArchivo}`

    const { error: uploadError } = await supabase.storage
      .from('licencias')
      .upload(path, buffer, {
        contentType: req.file.mimetype,
        upsert: true
      })

    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage.from('licencias').getPublicUrl(path)

    return res.json({
      ok: true,
      mensaje: 'Archivo subido correctamente',
      archivo: nombreArchivo,
      ruta: path,
      url: urlData.publicUrl
    })
  } catch (err) {
    console.error('❌ Error subiendo archivo:', err)
    return res.status(500).json({
      ok: false,
      mensaje: 'Error al subir archivo',
      detalle: err.message
    })
  }
})



//  GET /api/archivos/mios → Listar archivos del usuario autenticado desde Supabase
router.get('/mios', requireAuth, async (req, res) => {
  try {
    const id_usuario = String(req.user?.id_usuario)
    if (!id_usuario) {
      return res.status(401).json({ ok: false, mensaje: 'Usuario no autenticado' })
    }

    const { data: archivos, error } = await supabase.storage
      .from('licencias')
      .list(id_usuario, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      })

    if (error) throw error

    const archivosConUrl = await Promise.all(
      archivos.map(async (archivo) => {
        const ruta = `${id_usuario}/${archivo.name}`
        const { data: signedData, error: signedError } = await supabase.storage
          .from('licencias')
          .createSignedUrl(ruta, 60 * 60) // válido por 1 hora

        if (signedError) throw signedError

        return {
          nombre: archivo.name,
          url: signedData.signedUrl
        }
      })
    )

    return res.json({ ok: true, archivos: archivosConUrl })
  } catch (err) {
    console.error('❌ Error listando archivos del usuario:', err)
    return res.status(500).json({
      ok: false,
      mensaje: 'Error al listar archivos',
      detalle: err.message
    })
  }
})

// endpoint subir imagen perfil 
// POST /api/archivos/subir-perfil → Subir imagen generada al bucket 'perfil'
// POST /api/archivos/subir-perfil → Subir imagen circular al bucket 'perfil'
// GET /api/archivos/perfil → Obtener imagen de perfil del usuario autenticado
router.get('/perfil', requireAuth, async (req, res) => {
  try {
    const id_usuario = String(req.user?.id_usuario)
    if (!id_usuario) {
      return res.status(401).json({ ok: false, mensaje: 'Usuario no autenticado' })
    }

    const { data: archivos, error } = await supabase.storage
      .from('perfil')
      .list(id_usuario, {
        limit: 10,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      })

    if (error) throw error
    if (!archivos || archivos.length === 0) {
      return res.json({ ok: true, url: null, mensaje: 'Sin imagen de perfil' })
    }

    const archivo = archivos[0] // tomamos la más reciente
    const ruta = `${id_usuario}/${archivo.name}`

    const { data: signedData, error: signedError } = await supabase.storage
      .from('perfil')
      .createSignedUrl(ruta, 60 * 60) // válido por 1 hora

    if (signedError) throw signedError

    return res.json({
      ok: true,
      url: signedData.signedUrl,
      nombre: archivo.name
    })
  } catch (err) {
    console.error('❌ Error obteniendo imagen de perfil:', err)
    return res.status(500).json({
      ok: false,
      mensaje: 'Error al obtener imagen de perfil',
      detalle: err.message
    })
  }
})


router.post('/subir-perfil', requireAuth, upload.single('imagen'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, mensaje: 'Imagen no recibida' })
    }

    const id_usuario = req.user?.id_usuario
    if (!id_usuario) {
      return res.status(401).json({ ok: false, mensaje: 'Usuario no autenticado' })
    }

    const buffer = req.file.buffer
    const nombreArchivo = req.file.originalname
    const path = `${id_usuario}/${Date.now()}_${nombreArchivo}`

    const { error: uploadError } = await supabase.storage
      .from('perfil') // ← bucket cambiado
      .upload(path, buffer, {
        contentType: req.file.mimetype,
        upsert: true
      })

    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage.from('perfil').getPublicUrl(path)

    return res.json({
      ok: true,
      mensaje: 'Imagen de perfil subida correctamente',
      archivo: nombreArchivo,
      ruta: path,
      url: urlData.publicUrl
    })
  } catch (err) {
    console.error('❌ Error subiendo imagen de perfil:', err)
    return res.status(500).json({
      ok: false,
      mensaje: 'Error al subir imagen de perfil',
      detalle: err.message
    })
  }
})


export default router
