import { DataTypes, Model } from 'sequelize';
import sequelize from '../db/sequelize.js';

class LicenciaMedica extends Model {}

LicenciaMedica.init(
  {
    id_licencia: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    folio: { type: DataTypes.STRING(50), allowNull: false },
    fecha_inicio: { type: DataTypes.DATE, allowNull: false },
    fecha_fin: { type: DataTypes.DATE, allowNull: false },
    estado: {
      // Añadido 'sin validar' al ENUM para que coincida con el defaultValue
      type: DataTypes.ENUM('sin validar', 'en revisión', 'aprobada', 'rechazada'),
      allowNull: false,
      defaultValue: 'sin validar'
    },
    motivo_rechazo: { type: DataTypes.TEXT, allowNull: true },
    fecha_creacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  },
  { sequelize, tableName: 'licencia_medica', timestamps: false }
);

export default LicenciaMedica;
