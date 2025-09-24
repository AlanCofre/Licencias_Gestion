
import { Router } from 'express';

import requireAuthMod, { authRequired } from '../../middlewares/requireAuth.js';    
import { validarJWT, esEstudiante, tieneRol } from '../../middlewares/auth.js';                   // CJS → default             // CJS → default
import {crearLicencia, crearLicenciaLegacy, listarLicencias} from '../../controllers/licencias.controller.js';                    // { crearLicencia }

import {
  upload as uploadArchivoLicencia,
  handleMulterError as handleMulterErrorArchivoLicencia,
  MAX_MB as MAX_MB_ARCHIVO_LICENCIA,
} from '../../middlewares/uploadArchivoLicencia.js';

import {validateLicenciaBody, validarLicencia} from '../../middlewares/validarLicenciaMedica.js';

import { LicenciaMedica, Usuario } from '../models/index.js';


import { crearLicencia as crearLicenciaRoles} from '../../controllers/licencias.controller.js';

// Normalización por si algunos vienen de CJS
const requireAuth = requireAuthMod?.default ?? requireAuthMod;
const router = Router();

// ===================================================================================
// RUTAS DE LECTURA (conservadas)
// ===================================================================================

// GET / → listado con filtros + paginación (de licenciamedica.routes.js)
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '10', 10)));
    const offset = (page - 1) * limit;

    const where = {};
    if (req.query.estado) where.estado = req.query.estado;
    if (req.query.id_usuario) where.id_usuario = req.query.id_usuario;

    const Model = LicenciaMedica || Licencia;
    const { count, rows } = await Model.findAndCountAll({
      where,
      order: [
        ['fecha_creacion', 'DESC'],
        ['id_licencia', 'DESC'],
      ],
      limit,
      offset,
    });

    res.json({ ok: true, page, limit, total: count, data: rows });
  } catch (e) {
    console.error('[licenciamedica:list]', e);
    res.status(500).json({ ok: false, mensaje: 'Error interno' });
  }
}); // :contentReference[oaicite:5]{index=5}

// GET /ping (de licenciamedica.routes.js)
router.get('/ping', (_req, res) => res.json({ ok: true, router: 'licencias.unificado' })); // :contentReference[oaicite:6]{index=6}

router.get('/licencias', async (req, res) => {
  try {
    const limit = Number(req.query.limit || 20);
    const licencias = await (LicenciaMedica || Licencia).findAll({
      limit,
      include: [{ model: Usuario, attributes: ['id_usuario', 'correo_usuario', 'nombre'] }],
    });
    res.json(licencias);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
}); // :contentReference[oaicite:7]{index=7}

// GET /mis-licencias (de licencias.route.js)
router.get('/mis-licencias', validarJWT, listarLicencias); // :contentReference[oaicite:8]{index=8}

// GET /revisar (de licencias.route.js)
router.get('/revisar', [validarJWT, tieneRol('profesor', 'secretario')], (req, res) => {
  res.json({ msg: 'Revisando licencias...' });
}); // :contentReference[oaicite:9]{index=9}

// ===================================================================================
/* RUTAS DE CREACIÓN – 3 FLUJOS ORIGINALES, AHORA DESAMBIGUADOS
   - POST /legacy  → requireAuth + validarLicencia + ctrl.crearLicencia          (licencia.routes.js)
   - POST /medica  → uploadArchivoLicencia + validateLicenciaBody + create       (licenciamedica.routes.js)
   - POST /license → uploadLicenseFile   + validateLicenseBody   + create        (license.routes.js)
   - POST /        → alias de compatibilidad que “adivina” el flujo por el body

   NOTA: Mantener endpoints separados evita conflictos de “tragar” el stream con 2 middlewares de upload.
*/
// ===================================================================================

// POST /legacy (de licencia.routes.js)
router.post('/legacy', authRequired, validarLicencia , crearLicenciaLegacy); // :contentReference[oaicite:10]{index=10}

// POST /medica (de licenciamedica.routes.js)
router.post(
  '/medica',
  uploadArchivoLicencia.single('archivo'),
  handleMulterErrorArchivoLicencia,
  validateLicenciaBody,
  async (req, res) => {
    try {
      const nueva = await (LicenciaMedica || Licencia).create({
        folio: req.validated.folio,
        fecha_emision: req.validated.fecha_emision || null,
        fecha_inicio: req.validated.fecha_inicio,
        fecha_fin: req.validated.fecha_fin,
        estado: req.validated.estado,
        motivo_rechazo: req.validated.motivo_rechazo ?? null,
        fecha_creacion: new Date(),
        id_usuario: req.validated.id_usuario,
      });
      return res.status(201).json({ ok: true, data: nueva });
    } catch (e) {
      console.error('[licenciamedica:create]', e);
      return res.status(500).json({ ok: false, mensaje: 'Error interno' });
    }
  }
); // :contentReference[oaicite:11]{index=11}

// POST /license (de license.routes.js)
router.post(
  '/license',
  uploadArchivoLicencia.single('archivo'),
  handleMulterErrorArchivoLicencia,
  validateLicenciaBody,
  async (req, res) => {
    try {
      const data = req.validated;

      if (data.requiere_archivo && !req.file) {
        return res.status(400).json({
          ok: false,
          errores: [{ campo: 'archivo', mensaje: `Debes adjuntar un archivo (máx ${MAX_MB_ARCHIVO_LICENCIA}MB)` }],
        });
      }

      // Aquí podrías subir a Storage y obtener archivoUrl
      const archivoUrl = null;

      const nueva = await (License || Licencia).create({
        studentId: data.studentId,
        tipo: data.tipo,
        motivo: data.motivo,
        descripcion: data.descripcion,
        fecha_inicio: data.fecha_inicio,
        fecha_fin: data.fecha_fin,
        archivo_url: archivoUrl,
      });

      return res.status(201).json({ ok: true, data: nueva });
    } catch (e) {
      console.error('[licenses:create] error:', e);
      return res.status(500).json({ ok: false, mensaje: 'Error interno al crear la licencia' });
    }
  }
); // :contentReference[oaicite:12]{index=12}

// POST /crear (roles, de licencias.route.js) → se mantiene tal cual
router.post('/crear', [validarJWT, esEstudiante], crearLicenciaRoles); // :contentReference[oaicite:13]{index=13}

// ===================================================================================
// ALIAS DE COMPATIBILIDAD: POST /  → intenta detectar el flujo por el body
//  - si viene `folio` → usa /medica
//  - si viene `studentId` → usa /license
//  - en otro caso → /legacy (requireAuth + validarLicencia + ctrl.crearLicencia)
// ===================================================================================
router.post('/', (req, res, next) => {
  const target = req.body?.folio ? '/medica' : (req.body?.studentId ? '/license' : '/legacy');
  req.url = target;                // cambiamos la URL de la request
  return router.handle(req, res, next); // delegamos al propio router
});

// ===================================================================================
// FIN
// ===================================================================================

export default router;
