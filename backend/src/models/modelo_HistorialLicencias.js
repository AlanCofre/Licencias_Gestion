import { DataTypes, Model } from 'sequelize';
import sequelize from '../db/sequelize.js';

class HistorialLicencias extends Model {}

HistorialLicencias.init(
  {
    id_historial: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    estado: {
      type: DataTypes.ENUM('sin validar', 'en revisión', 'aprobada', 'rechazada'),
      allowNull: false
    },
    observacion: { type: DataTypes.TEXT, allowNull: true },
    fecha_actualizacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  },
  { sequelize, tableName: 'historial_licencias', timestamps: false }
);

export default HistorialLicencias;
