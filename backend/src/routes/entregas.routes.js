// backend/src/routes/entregas.routes.js
import { Router } from 'express';
import { validarJWT } from '../../middlewares/auth.js';
import { LicenciasEntregas, Curso, Usuario, LicenciaMedica, Matricula } from '../models/index.js';
import validarPropietarioCurso from '../../middlewares/validarPropietarioCurso.js';


const router = Router();

router.get('/:id', validarJWT, validarPropietarioCurso, async (req, res) => {
  const idEntrega = req.params.id;
  console.log('🔍 Buscando entrega con ID:', idEntrega);

  try {
    const entrega = await LicenciasEntregas.findByPk(idEntrega, {
      include: [
        {
          model: Curso,
          as: 'curso',
          attributes: ['id_curso', 'codigo', 'nombre_curso', 'seccion', 'periodo', 'id_usuario'],
          include: {
            model: Usuario,
            as: 'profesor',
            attributes: ['id_usuario', 'nombre', 'correo_usuario']
          }
        },
        {
          model: LicenciaMedica,
          as: 'licencia',
          attributes: ['folio', 'fecha_emision', 'fecha_inicio', 'fecha_fin', 'estado', 'motivo_rechazo']
        }
      ]
    });

    if (!entrega) {
      console.log('📭 Entrega no encontrada');
      return res.status(404).json({ error: 'Entrega no encontrada' });
    }

    console.log('✅ Entrega encontrada:', entrega?.toJSON?.() ?? entrega);

    const matricula = await Matricula.findOne({
      where: { id_curso: entrega.id_curso },
      attributes: ['id_matricula', 'id_usuario', 'id_curso', 'fecha_matricula'], // ✅ sin 'id_periodo'
      include: {
        model: Usuario,
        as: 'estudiante',
        attributes: ['id_usuario', 'nombre', 'correo_usuario']
      }
    });

    const response = {
      id_entrega: entrega.id_entrega,
      fecha_creacion: entrega.fecha_creacion,
      curso: entrega.curso,
      profesor: entrega.curso.profesor,
      licencia: entrega.licencia,
      estudiante: matricula?.estudiante || null
    };

    res.json(response);
  } catch (error) {
    console.error('💥 Error interno en GET /entregas/:id:', error);
    res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
  }
});



export default router;
