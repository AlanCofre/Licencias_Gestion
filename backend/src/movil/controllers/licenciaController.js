import * as LicenciaModel from "../models/licenciaModel.js";

export const getLicencias = async (req, res) => {
  try {
    const licencias = await LicenciaModel.getAllLicencias();
    res.json(licencias);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getLicencia = async (req, res) => {
  try {
    const licencia = await LicenciaModel.getLicenciaById(req.params.id);
    if (!licencia) return res.status(404).json({ error: "Licencia no encontrada" });
    res.json(licencia);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createLicencia = async (req, res) => {
  try {
    const id = await LicenciaModel.createLicencia(req.body);
    res.status(201).json({ message: "Licencia creada", id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};