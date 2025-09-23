const express = require('express');
const router = express.Router();
const { licenciaSchema } = require('../validators/licencia.schema');
const { Licencia } = require('../models');
const dayjs = require('dayjs');

router.post('/', async (req, res) => {
  try {
    const data = licenciaSchema.parse(req.body);

    // Opcional: validar duración
    const maxDias = parseInt(process.env.MAX_DIAS_LICENCIA || '365', 10);
    const dur = dayjs(data.fecha_fin).diff(dayjs(data.fecha_inicio), 'day') + 1;
    if (dur > maxDias) {
      return res.status(400).json({ errors: [{ field: 'fecha_fin', message: `La duración no puede superar ${maxDias} días` }] });
    }

    // Opcional: solape
    const existeSolape = await Licencia.findOne({
      where: {
        user_id: req.user.id,
        fecha_inicio: { $lte: data.fecha_fin },
        fecha_fin: { $gte: data.fecha_inicio }
      }
    });
    if (existeSolape) {
      return res.status(409).json({ errors: [{ field: 'fecha_inicio', message: 'Existe una licencia que se solapa con ese rango de fechas' }] });
    }

    const nueva = await Licencia.create({ ...data, user_id: req.user.id });
    return res.status(201).json(nueva);
  } catch (err) {
    if (err.errors) { // Zod
      return res.status(400).json({ errors: err.errors.map(e => ({ field: e.path[0], message: e.message })) });
    }
    return res.status(500).json({ message: 'Error al crear la licencia' });
  }
});

module.exports = router;