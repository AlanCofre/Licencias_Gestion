// backend/src/movil/movil.routes.js
import { Router } from "express";

import licenciaRoutes from "./routes/licenciaRoutes.js";
import notificacionRoutes from "./routes/notificacionRoutes.js";
import authRoutes from "./routes/authRoutes.js";

const router = Router();

// Aquí respetamos la misma estructura que tenía la API original

router.use("/licencias", licenciaRoutes);         
router.use("/notificaciones", notificacionRoutes); 
router.use("/auth", authRoutes);                  

export default router;
