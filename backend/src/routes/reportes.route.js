// src/routes/reportes.route.js
import { Router } from 'express';
import { validarJWT, tieneRol, ROLES } from '../../middlewares/auth.js';
import { reporteExcesoLicenciasCtrl, repeticionPatologiasCtrl } from '../../controllers/reportes.controller.js';

const router = Router();

/**
 * Acceso permitido:
 * - ADMIN (total)
 * - PROFESOR (limitado a sus cursos; lo resuelve el service)
 * Si más adelante agregas "secretaria", agrégalo aquí: ROLES.SEC
 */
router.get(
  '/reportes/licencias/exceso',
  validarJWT,
  tieneRol(ROLES.ADMIN, ROLES.PROF),
  reporteExcesoLicenciasCtrl
);

router.get(
  '/reportes/licencias/repetidas',
  validarJWT,
  tieneRol(ROLES.ADMIN, ROLES.PROF, ROLES.FUNC), // acceso para funcionario, profesor y admin
  repeticionPatologiasCtrl
);

// verificar autenticación básica
function isAuthenticated(req, res, next) {
  if (req.user) {
    return next();
  }
  return res.status(401).json({ error: true, message: 'No autorizado' });
}

// POST /reports/test (fase preliminar)
router.post('/test', isAuthenticated, async (req, res) => {
  try {
    const { message } = req.body;

    // 2. Validación mínima del payload
    if (!message || message.trim() === '') {
      return res.status(400).json({
        error: true,
        message: 'El campo "message" es obligatorio.'
      });
    }

    // 5. Logging controlado
    console.log('Reporte recibido (fase preliminar).');

    // 4. Respuesta simulada de éxito
    return res.json({
      success: true,
      report: {
        id: 'temp-123',
        status: 'new',
        received: true
      }
    });

  } catch (err) {
    // 3. Manejo estándar de errores
    console.error('Error en /reports/test:', err);
    return res.status(500).json({
      error: true,
      message: 'Error al procesar el reporte.'
    });
  }
});

module.exports = router;



export default router;
