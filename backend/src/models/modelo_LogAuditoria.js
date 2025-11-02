import { DataTypes, Model } from 'sequelize';
import sequelize from '../../db/sequelize.js';

class LogAuditoria extends Model {}

LogAuditoria.init(
  {
    id_log: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    accion: {
      type: DataTypes.ENUM('crear', 'actualizar', 'eliminar', 'ver'),
      allowNull: false
    },
    recurso: { type: DataTypes.STRING(50), allowNull: false }, // ej: usuario, licencia, notificación
    payload: { type: DataTypes.TEXT, allowNull: true },        // ampliado para guardar más info
    ip: { type: DataTypes.STRING(50), allowNull: true },
    fecha: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  },
  { sequelize, tableName: 'logauditoria', timestamps: false }
);

export default LogAuditoria;
