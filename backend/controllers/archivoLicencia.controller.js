import ArchivoLicencia from '../models/ArchivoLicencia.js';
import { UniqueConstraintError, ValidationError } from 'sequelize';

export async function crearArchivoLicencia(req, res) {
  try {
    const { licencia_id, folio, nombre_archivo, url } = req.body;

    // Validación rápida
    if (!licencia_id || !folio || !nombre_archivo || !url) {
      return res.status(400).json({ ok: false, mensaje: 'Faltan campos obligatorios' });
    }

    const nuevo = await ArchivoLicencia.create({ licencia_id, folio, nombre_archivo, url });
    return res.status(201).json({ ok: true, data: nuevo });
  } catch (err) {
    if (err instanceof UniqueConstraintError) {
      return res.status(409).json({
        ok: false,
        mensaje: 'El número de folio ya está registrado. Debe ser único.',
        campo: 'folio',
      });
    }
    if (err instanceof ValidationError) {
      return res.status(400).json({ ok: false, mensaje: err.message });
    }
    console.error(err);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
  }
}
