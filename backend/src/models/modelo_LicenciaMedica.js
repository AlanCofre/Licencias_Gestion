// src/models/modelo_LicenciaMedica.js
import { DataTypes, Model } from 'sequelize';
import sequelize from '../../db/sequelize.js';
import Usuario from './modelo_Usuario.js';

class LicenciaMedica extends Model {}

LicenciaMedica.init({
  id_licencia: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  folio: { type: DataTypes.STRING(50), allowNull: false },
  fecha_emision: { type: DataTypes.DATE, allowNull: false },
  fecha_inicio: { type: DataTypes.DATE, allowNull: false },
  fecha_fin: { type: DataTypes.DATE, allowNull: false },
  estado: { 
    type: DataTypes.ENUM('pendiente', 'aceptado', 'rechazado'),
    allowNull: false,
    defaultValue: 'pendiente'
  },
  motivo_rechazo: { type: DataTypes.TEXT, allowNull: true },   // observación obligatoria en caso de rechazo
  fecha_creacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false }
}, { 
  sequelize, 
  tableName: 'LicenciaMedica', 
  timestamps: false 
});

LicenciaMedica.belongsTo(Usuario, { foreignKey: 'id_usuario' });

export default LicenciaMedica;
