import { DataTypes, Model } from 'sequelize'
import sequelize from '../../db/sequelize.js'

class LogAuditoria extends Model {}

LogAuditoria.init({
  id_log: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_usuario: { type: DataTypes.INTEGER, allowNull: true },
  accion: {
    type: DataTypes.ENUM(
      'crear_cuenta',
      'actualizar_cuenta',
      'iniciar_sesion',
      'recuperar_contrasena',
      'emitir_licencia',
      'cambiar_estado_licencia',
      'ver_historial',
      'ver_detalle'
    ),
    allowNull: false
  },
  recurso: { type: DataTypes.STRING(50), allowNull: false },
  payload: { type: DataTypes.TEXT, allowNull: true }, // guarda JSON.stringify(...)
  ip: { type: DataTypes.STRING(50), allowNull: true },
  fecha: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
}, {
  sequelize,
  tableName: 'logauditoria',
  timestamps: false
})

export default LogAuditoria
