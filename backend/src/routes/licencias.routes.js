// backend/src/routes/licencias.routes.js
import { Router } from 'express';
import multer from 'multer';
import db from '../../db/db.js';
import {
  crearLicencia,
  listarLicencias,
  notificarEstado,
  decidirLicencia,
  getLicenciasEnRevision,
  detalleLicencia,
  descargarArchivoLicencia,
  licenciasResueltas,
} from '../../controllers/licencias.controller.js';

import { validarJWT, esEstudiante, tieneRol } from '../../middlewares/auth.js';
import { cambiarEstado } from '../../controllers/licencias.controller.js';
import { authRequired } from '../../middlewares/requireAuth.js';
import { requireRole } from '../../middlewares/requireRole.js';
import { validateDecision } from '../../middlewares/validateDecision.js';
import {
  validateLicenciaBody,
  validarArchivoAdjunto,
  validarTransicionEstado,
  normalizaEstado,
} from '../../middlewares/validarLicenciaMedica.js';
import { decidirLicenciaSvc } from '../../services/servicio_Licencias.js';

// import LicenciaMedica from '../models/modelo_LicenciaMedica.js';
import { LicenciasEntregas, Curso, Usuario, LicenciaMedica, Matricula } from '../models/index.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

async function cargarLicencia(req, res, next) {
  try {
    const lic = await LicenciaMedica.findByPk(req.params.id);
    if (!lic) return res.status(404).json({ ok: false, error: 'Licencia no encontrada' });
    req.licencia = lic;
    next();
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: 'Error al obtener licencia' });
  }
}

/* ===== Listados / creación ===== */
router.get('/mis-licencias', validarJWT, listarLicencias);

router.get('/en-revision', validarJWT, getLicenciasEnRevision);
router.get('/detalle/:id', validarJWT, detalleLicencia);
router.get('/licencias/:id/archivo', validarJWT, descargarArchivoLicencia);
// SOLO Estudiante (creación con validaciones de negocio)
router.post(
  '/crear',
  [validarJWT, esEstudiante],
  upload.single('archivo'),   // req.file
  validarArchivoAdjunto,      // archivo obligatorio/tipo/tamaño (o archivo_url)
  validateLicenciaBody,       // Zod: fechas (YYYY-MM-DD, <=90 días), estado, etc.
  crearLicencia               // tu controller (forzarás estado 'pendiente' al guardar)
);

// Profesor o Secretario (demo simple)
router.get('/revisar', [validarJWT, tieneRol('profesor', 'secretario')], (req, res) => {
  res.json({ ok: true, msg: 'Revisando licencias...', rol: req.rol });
});

/**
 * Decidir licencia (SECRETARIO):
 * - validateDecision: valida body (ej. { estado, motivo_rechazo })
 * - cargarLicencia: trae la licencia y la deja en req.licencia
 * - validarTransicionEstado: aplica la regla de transición usando el estado actual
 *   pendiente → (aceptado|rechazado) ✅; otras ❌
 */


// === Endpoint: Licencias entregadas por el profesor en sus cursos ===
router.get('/mis-cursos', validarJWT, tieneRol('profesor'), async (req, res) => {
  console.log('🧪 Entró al endpoint /mis-cursos');
  const { periodo } = req.query;
  const idProfesor = req.user?.id_usuario;

  console.log('🔍 req.user:', req.user);
  console.log('🧪 Query params:', { idProfesor, periodo });

  // Validaciones
  if (!idProfesor) {
    return res.status(401).json({ ok: false, error: "No se pudo identificar al profesor." });
  }

  if (!periodo || typeof periodo !== 'string') {
    return res.status(400).json({ ok: false, error: "El campo 'periodo' es obligatorio y debe ser texto." });
  }

  try {
    const [licencias] = await db.execute(`
      SELECT lm.id_licencia,
             lm.id_usuario AS id_estudiante,
             lm.folio,
             lm.fecha_emision,
             lm.fecha_inicio,
             lm.fecha_fin,
             lm.estado
      FROM licenciamedica lm
      JOIN licencias_entregas le ON lm.id_licencia = le.id_licencia
      JOIN curso c ON le.id_curso = c.id_curso
      WHERE c.id_usuario = ?
        AND c.periodo = ?
      ORDER BY lm.fecha_emision DESC
    `, [idProfesor, periodo]);

    return res.status(200).json({ ok: true, licencias });
  } catch (error) {
    console.error('❌ Error al obtener licencias del profesor:', error);
    return res.status(500).json({ ok: false, error: 'Error interno del servidor' });
  }
});



router.put(
  '/:id/estado',
  authRequired,
  requireRole(['secretario']),
  cambiarEstado
);

router.put('/licencias/:id/decidir', authRequired, requireRole(['secretario']), async (req, res, next) => {
  console.log('🟢 Entrando a PUT /licencias/:id/decidir');

  const idLicencia = Number(req.params.id);
  if (!idLicencia) {
    return res.status(400).json({ ok: false, error: "El campo 'id' es obligatorio." });
  }

  const licencia = await LicenciaMedica.findByPk(idLicencia);
  if (!licencia) {
    return res.status(404).json({ ok: false, error: "Licencia no encontrada" });
  }

  const { estado } = req.body;
  const campos = {
    id_licencia: idLicencia,
    id_usuario: licencia.id_usuario,
    id_profesor: licencia.id_profesor,
    estado
  };

  for (const [campo, valor] of Object.entries(campos)) {
    if (valor === undefined || valor === null || valor === '') {
      return res.status(400).json({
        ok: false,
        error: `El campo '${campo}' es obligatorio. Por favor, complétalo.`
      });
    }
  }

  if (licencia.estado !== 'pendiente') {
    return res.status(403).json({ ok: false, error: "Acción no permitida" });
  }

  const estudiante = await Usuario.findByPk(licencia.id_usuario);
  if (!estudiante || estudiante.rol !== 'estudiante') {
    return res.status(404).json({ ok: false, error: "Estudiante no encontrado" });
  }

  const profesor = await Usuario.findByPk(licencia.id_profesor);
  if (!profesor || profesor.rol !== 'profesor') {
    return res.status(404).json({ ok: false, error: "Docente no encontrado" });
  }

  if (req.body?.estado) {
    req.body.estado = normalizaEstado(req.body.estado);
  }

  // Actualizar estado de la licencia
  licencia.estado = req.body.estado;
  await licencia.save();
  console.log('✅ Estado actualizado a:', licencia.estado);

  // Solo si fue aceptada, insertar entregas
  if (licencia.estado === 'aceptado') {
    try {
      const cursos = await Matricula.findAll({
        where: { id_usuario: estudiante.id_usuario },
        attributes: ['id_curso']
      });
      console.log('📦 Cursos encontrados:', cursos.map(c => c.id_curso));

      for (const { id_curso } of cursos) {
        try {
          const entrega = await LicenciasEntregas.create({
            id_licencia: idLicencia,
            id_curso
          });
          console.log('✅ Entrega insertada:', entrega?.toJSON?.() ?? entrega);
        } catch (error) {
          if (error.name === 'SequelizeUniqueConstraintError') {
            console.warn(`⚠️ Entrega duplicada ignorada: licencia ${idLicencia}, curso ${id_curso}`);
            continue;
          }
          console.error(`❌ Error al insertar entrega: ${error.message}`);
          return res.status(500).json({ ok: false, error: "Error al registrar entregas de licencia." });
        }
      }
    } catch (error) {
      console.error(`💥 Error al obtener cursos del estudiante: ${error.message}`);
      return res.status(500).json({ ok: false, error: "No se pudieron obtener los cursos del estudiante." });
    }
  }
  req.licencia = licencia;
  decidirLicencia(req, res, next);
});


router.put('/:id/notificar',
  authRequired,
  requireRole(['funcionario']),
  validateDecision,
  async (req, res) => {
    try {
      const idLicencia = Number(req.params.id);
      const { estado, motivo_rechazo, observacion, fecha_inicio, fecha_fin } = req.body;
      const actorId = req.user?.id_usuario ?? null;

      const resultado = await decidirLicenciaSvc({
        idLicencia,
        estado,
        motivo_rechazo,
        observacion,
        _fi: fecha_inicio,
        _ff: fecha_fin,
        idFuncionario: actorId,
        ip: req.ip 
      });

      return res.status(200).json({ ok: true, ...resultado });
    } catch (error) {
      console.error('❌ Error en /notificar:', error);
      return res.status(error.http ?? 500).json({ ok: false, error: error.message });
    }
  }
);

router.get('/resueltas', validarJWT, async (req, res) => {
  const { estado, desde, hasta } = req.query;
  let condiciones = [`estado IN ('aceptado', 'rechazado')`];
  const valores = [];

  if (estado && ['aceptado', 'rechazado'].includes(estado)) {
    condiciones = [`estado = ?`];
    valores.push(estado);
  }
  if (desde) { condiciones.push(`fecha_emision >= ?`); valores.push(desde); }
  if (hasta) { condiciones.push(`fecha_emision <= ?`); valores.push(hasta); }

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

  try {
    const [licencias] = await db.execute(`
      SELECT id_licencia, folio, fecha_emision, fecha_inicio, fecha_fin,
             estado, motivo_rechazo, fecha_creacion, id_usuario
      FROM licenciamedica
      ${where}
      ORDER BY fecha_creacion DESC
    `, valores);
    return res.status(200).json({ licencias });
  } catch (error) {
    console.error('❌ Error al obtener licencias resueltas:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post(
  '/',
  validarJWT,
  esEstudiante,
  upload.single('archivo'),
  validarArchivoAdjunto,
  validateLicenciaBody,
  crearLicencia
);

/* ===== Rutas con :id (restringidas a numérico) ===== */
router.get('/:id', validarJWT, detalleLicencia);
router.get('/:id/archivo', validarJWT, descargarArchivoLicencia);

router.post(
  '/:id/rechazar',
  validarJWT,
  tieneRol('funcionario'),
  (req, _res, next) => { req.body = { ...(req.body || {}), decision: 'rechazado' }; next(); },
  validateDecision,
  cargarLicencia,
  (req, res, next) => validarTransicionEstado(req.licencia.estado)(req, res, next),
  decidirLicencia
);

export default router;
