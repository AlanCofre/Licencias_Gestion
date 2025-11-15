// backend/src/routes/entregas.routes.js
import { Router } from 'express';
import { validarJWT } from '../../middlewares/auth.js';
import { LicenciasEntregas, Curso, Usuario, LicenciaMedica, Matricula } from '../models/index.js';
import validarPropietarioCurso from '../../middlewares/validarPropietarioCurso.js';


const router = Router();
// backend/src/routes/entregas.routes.js
router.get('/:id', validarJWT, validarPropietarioCurso, async (req, res) => {
  const idEntrega = req.params.id;

  try {
    const entrega = await LicenciasEntregas.findByPk(idEntrega, {
      include: [
        {
          model: Curso,
          as: 'curso',
          attributes: ['id_curso', 'codigo_curso', 'nombre_curso', 'seccion', 'id_usuario'],
          include: [
            {
              model: Usuario,
              as: 'profesor',
              attributes: ['id_usuario', 'nombre', 'correo_usuario']
            },
            {
              model: Periodo,
              as: 'periodo',
              attributes: ['id_periodo', 'codigo', 'activo']
            }
          ]
        },
        {
          model: LicenciaMedica,
          as: 'licencia',
          attributes: ['folio', 'fecha_emision', 'fecha_inicio', 'fecha_fin', 'estado', 'motivo_rechazo']
        }
      ]
    });

    // Resto del código...
  } catch (error) {
    console.error('💥 Error interno en GET /entregas/:id:', error);
    res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
  }
});

export default router;
