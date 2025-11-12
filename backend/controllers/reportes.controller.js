// backend/controllers/reportes.controller.js
import { excesoLicenciasSvc, repeticionPatologiasSvc } from '../services/reportes.service.js';

/**
 * GET /reportes/licencias/exceso
 * Query:
 *  - year   (int, default: año actual)
 *  - limite (int, default: 5)  → se reportan quienes tienen COUNT(*) > limite
 *  - curso_id (int, opcional)
 *  - seccion  (int|str, opcional)
 *
 * Roles:
 *  - administrador: acceso total
 *  - profesor: restringe a sus cursos (via id_usuario en tabla curso)
 */
export async function reporteExcesoLicenciasCtrl(req, res) {
  try {
    const nowYear = new Date().getFullYear();

    const year   = Number.isFinite(+req.query?.year)   ? parseInt(req.query.year, 10)   : nowYear;
    const limite = Number.isFinite(+req.query?.limite) ? parseInt(req.query.limite, 10) : 5;

    if (!Number.isInteger(year) || year < 2000 || year > 3000) {
      return res.status(400).json({ ok: false, error: 'Parámetro "year" inválido' });
    }
    if (!Number.isInteger(limite) || limite < 0) {
      return res.status(400).json({ ok: false, error: 'Parámetro "limite" inválido' });
    }

    const curso   = req.query?.curso_id ? parseInt(req.query.curso_id, 10) : null;
    const seccion = req.query?.seccion ?? null;

    const rol = String(req.user?.rol || '').toLowerCase();
    const idProfesor = (rol === 'profesor') ? (req.user?.id_usuario ?? req.user?.id ?? null) : null;

    const filtro = { year, limite, curso, seccion };
    const data = await excesoLicenciasSvc({ filtro, idProfesor });

    return res.json({ ok: true, count: data.length, data });
  } catch (err) {
    console.error('[reporteExcesoLicencias]', err);
    return res.status(500).json({ ok: false, error: 'Error al generar reporte' });
  }
}

export async function repeticionPatologiasCtrl(req, res) {
  try {
    const nowYear = new Date().getFullYear();
    const year   = Number.isFinite(+req.query?.year)   ? parseInt(req.query.year, 10)   : nowYear;
    const limite = Number.isFinite(+req.query?.limite) ? parseInt(req.query.limite, 10) : 2;

    if (!Number.isInteger(year) || year < 2000 || year > 3000) {
      return res.status(400).json({ ok: false, error: 'Parámetro "year" inválido' });
    }
    if (!Number.isInteger(limite) || limite < 1) {
      return res.status(400).json({ ok: false, error: 'Parámetro "limite" inválido' });
    }

    const curso   = req.query?.curso_id ? parseInt(req.query.curso_id, 10) : null;
    const seccion = req.query?.seccion ?? null;

    const rol = String(req.user?.rol || '').toLowerCase();
    const idProfesor = (rol === 'profesor') ? (req.user?.id_usuario ?? req.user?.id ?? null) : null;

    const filtro = { year, limite, curso, seccion };
    const data = await repeticionPatologiasSvc({ filtro, idProfesor });

    return res.json({ ok: true, count: data.length, data });
  } catch (err) {
    console.error('[repeticionPatologiasCtrl]', err);
    return res.status(500).json({ ok: false, error: 'Error al generar reporte de patologías repetidas' });
  }
}



export default { reporteExcesoLicenciasCtrl, repeticionPatologiasCtrl };
