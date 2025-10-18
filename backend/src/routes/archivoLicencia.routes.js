import { Router } from 'express';
import { crearArchivoLicencia } from '../controllers/archivoLicencia.controller.js';
import { authMiddleware, role } from '../middlewares/auth.js';

const router = Router();

// Ajusta roles si aplica
router.post('/archivos', authMiddleware, role(['secretario','estudiante']), crearArchivoLicencia);

export default router;
