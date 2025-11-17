import { DataTypes, Model } from 'sequelize';
import sequelize from '../../db/sequelize.js';

class Periodo extends Model {}

Periodo.init(
  {
    id_periodo: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    codigo: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true,
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: 'Periodo',
    tableName: 'periodos_academicos',
    timestamps: false,
  }
);

export default Periodo;