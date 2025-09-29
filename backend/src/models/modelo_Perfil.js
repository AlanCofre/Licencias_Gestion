import { DataTypes } from 'sequelize';
import sequelize from '../../db/sequelize.js';

const Perfil = sequelize.define('Perfil', {
  id_perfil:   { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_usuario:  { type: DataTypes.INTEGER, allowNull: false, unique: true },
  email_alt:  { type: DataTypes.STRING(255), allowNull: true, validate: { isEmail: { msg: 'Correo alternativo inválido' } } },
  numero_telef:    { type: DataTypes.STRING(20),  allowNull: true, validate: { is: { args: [/^[+()\-\s\d]{6,20}$/], msg: 'Teléfono inválido' } } },
  direccion:   { type: DataTypes.STRING(255), allowNull: true },
  foto_url:    { type: DataTypes.TEXT,        allowNull: true, validate: { isUrl: { msg: 'URL de foto inválida' } } }
}, {
  modelName: 'Perfil',
  tableName: 'perfil',              // <-- exactamente como en MySQL
  timestamps: false,

});

export default Perfil;
