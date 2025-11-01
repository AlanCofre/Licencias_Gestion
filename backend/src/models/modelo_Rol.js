import { DataTypes, Model } from 'sequelize';
import { sequelize }from '../../db/sequelize.js';

class Rol extends Model {}

Rol.init(
  {
    id_rol: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre_rol: {
      type: DataTypes.ENUM('estudiante', 'profesor', 'secretario'),
      allowNull: false
    },
    descripcion: { type: DataTypes.TEXT, allowNull: true }
  },
  { sequelize, tableName: 'rol', timestamps: false }
);

export default Rol;
