import express from "express";
import * as LicenciaController from "../controllers/licenciaController.js";

const router = express.Router();

router.get("/", LicenciaController.getLicencias);
router.get("/:id", LicenciaController.getLicencia);
router.post("/create", LicenciaController.createLicencia);

export default router;