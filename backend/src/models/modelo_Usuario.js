import { DataTypes, Model } from 'sequelize';
import sequelize from '../db/sequelize.js';

class Usuario extends Model {}

Usuario.init(
  {
    id_usuario: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    correo_usuario: { type: DataTypes.STRING(50), unique: true, allowNull: false },
    nombre: { type: DataTypes.STRING(50), allowNull: false },
    contrasena: { type: DataTypes.STRING(100), allowNull: false },
    activo: { type: DataTypes.BOOLEAN, defaultValue: true }
  },
  { sequelize, tableName: 'usuario', timestamps: false }
);

export default Usuario;
