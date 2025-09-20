import { DataTypes } from 'sequelize';
import db from '../../config/db.js';
import Rol from './modelo_Rol.js';

const Usuario = db.define('Usuario', {
  id_usuario: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  correo_usuario: { type: DataTypes.STRING(50), unique: true, allowNull: false},
  nombre: { type: DataTypes.STRING(50), allowNull: false },
  contrasena: { type: DataTypes.STRING(50), allowNull: false },
  activo: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
  tableName: 'usuario',
  timestamps: false
});

Rol.hasMany(Usuario, { foreignKey: 'id_rol' });
Usuario.belongsTo(Rol, { foreignKey: 'id_rol' });

export default Usuario;
