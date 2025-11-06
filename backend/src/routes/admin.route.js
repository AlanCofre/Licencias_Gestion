// backend/routes/admin.route.js
import { Router } from "express";
import { listarCursosMatriculas } from "../../controllers/admin.controller.js";
import requireAuth from "../../middlewares/requireAuth.js";
import { esAdmin } from "../../middlewares/roles.middleware.js";

const router = Router();

// GET /admin/cursos-matriculas?periodo=2025-1&profesor=4&curso=12
router.get("/cursos-matriculas", requireAuth, esAdmin, listarCursosMatriculas);

export default router;
