import { DataTypes, Model } from 'sequelize';
import sequelize from '../db/sequelize.js';
import db from '../../config/db.js';
import Usuario from './modelo_Usuario.js';

const LicenciaMedica = db.define('LicenciaMedica', {
  id_licencia: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  folio: { type: DataTypes.STRING(45), allowNull: false },
  fecha_emision: { type: DataTypes.DATEONLY, allowNull: false },
  fecha_inicio: { type: DataTypes.DATEONLY, allowNull: false },
  fecha_fin: { type: DataTypes.DATEONLY, allowNull: false },
  estado: { type: DataTypes.ENUM('pendiente','aceptado','rechazado'), defaultValue: 'pendiente' },
  motivo_rechazo: { type: DataTypes.TEXT, allowNull: true },
  fecha_creacion: { type: DataTypes.DATEONLY, allowNull: false }
}, {
  tableName: 'LicenciaMedica',
  timestamps: false
});

class LicenciaMedica extends Model {}

export default LicenciaMedica;

export default LicenciaMedica;
