export async function getNotificaciones(req, res) {
  const id_usuario = req.user.id_usuario;
  const notificaciones = await Notificacion.findAll({
    where: { id_usuario },
    order: [["fecha_envio", "DESC"]],
  });
  res.json({ ok: true, data: notificaciones });
}

export default {getNotificaciones}