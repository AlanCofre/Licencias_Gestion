import Usuario from '../src/models/modelo_Usuario.js';
import Perfil from '../src/models/modelo_Perfil.js';
import { validarPerfilPayload } from '../src/utils/validaciones_perfil.js';

export const obtenerMiPerfil = async (req, res) => {
  try {
    const { id_usuario } = req.user;
    const usuario = await Usuario.findByPk(id_usuario, {
      attributes: ['id_usuario','nombre','correo_usuario','activo'],
      include: [{ model: Perfil, as: 'perfil' }]
    });
    if (!usuario) return res.status(404).json({ ok:false, error:'Usuario no encontrado' });
    res.json({ ok:true, data: usuario });
  } catch (e) {
    res.status(500).json({ ok:false, error: e.message });
  }
};

export const guardarMiPerfil = async (req, res) => {
  try {
    const { id_usuario } = req.user;
    const { valido, errores, data } = validarPerfilPayload(req.body);
    if (!valido) return res.status(422).json({ ok:false, error:'Payload inválido', detalles: errores });

    const [perfil, created] = await Perfil.findOrCreate({
      where: { id_usuario },
      defaults: { id_usuario, ...data }
    });
    if (!created) await perfil.update(data);

    res.json({ ok:true, created, data: perfil });
  } catch (e) {
    res.status(500).json({ ok:false, error: e.message });
  }
};

export const obtenerPerfilPorUsuario = async (req, res) => {
  try {
    const { id_usuario } = req.params;
    const usuario = await Usuario.findByPk(id_usuario, {
      attributes: ['id_usuario','nombre','correo_usuario','activo'],
      include: [{ model: Perfil, as: 'perfil' }]
    });
    if (!usuario) return res.status(404).json({ ok:false, error:'Usuario no encontrado' });
    res.json({ ok:true, data: usuario });
  } catch (e) {
    res.status(500).json({ ok:false, error: e.message });
  }
};

export const NotificacionesPassword = async (req, res) => {
  try {
    const { id_usuario } = req.user;

    const [notificaciones] = await db.execute(
      'SELECT id_notificacion, asunto, contenido, fecha_envio FROM notificaciones WHERE id_usuario = ? AND asunto = ? ORDER BY fecha_envio DESC',
      [id_usuario, 'Cambio de contraseña']
    );

    console.log('🔐 Notificaciones de cambio de contraseña:', notificaciones);

    res.json({ ok: true, mensaje: 'Notificaciones de contraseña mostradas en terminal' });
  } catch (e) {
    console.error('❌ Error al obtener notificaciones de contraseña:', e);
    res.status(500).json({ ok: false, error: e.message });
  }
};


export const NotificacionesPerfil = async (req, res) => {
  try {
    const { id_usuario } = req.user;

    const [notificaciones] = await db.execute(
      'SELECT id_notificacion, asunto, contenido, fecha_envio FROM notificaciones WHERE id_usuario = ? AND asunto = ? ORDER BY fecha_envio DESC',
      [id_usuario, 'Actualización de perfil']
    );

    console.log('👤 Notificaciones de modificación de perfil:', notificaciones);

    res.json({ ok: true, mensaje: 'Notificaciones de perfil mostradas en terminal' });
  } catch (e) {
    console.error('❌ Error al obtener notificaciones de perfil:', e);
    res.status(500).json({ ok: false, error: e.message });
  }
};
