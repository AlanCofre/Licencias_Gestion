import { DataTypes, Model } from 'sequelize';
import sequelize from '../../db/sequelize.js';

class Notificacion extends Model {}

Notificacion.init(
  {
    id_notificacion: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    asunto: { type: DataTypes.TEXT, allowNull: false },
    contenido: { type: DataTypes.TEXT, allowNull: false },
    leido: { type: DataTypes.BOOLEAN, defaultValue: false },
    fecha_envio: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  },
  { sequelize, tableName: 'notificacion', timestamps: false }
);

export default Notificacion;
