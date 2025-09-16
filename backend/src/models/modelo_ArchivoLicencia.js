const { DataTypes } = require('sequelize');
const db = require('../config/db');
const LicenciaMedica = require('./modelo_LicenciaMedica');

const ArchivoLicencia = db.define('ArchivoLicencia', {
  id_archivo: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  ruta_url: { type: DataTypes.STRING(4096), allowNull: false },
  tipo_mime: { type: DataTypes.STRING(100), allowNull: false },
  hash: { type: DataTypes.STRING(128), allowNull: false },
  tamano: { type: DataTypes.INTEGER, allowNull: false },
  fecha_subida: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'archivo_licencia',
  timestamps: false
});

LicenciaMedica.hasMany(ArchivoLicencia, { foreignKey: 'id_licencia', onDelete: 'CASCADE' });
ArchivoLicencia.belongsTo(LicenciaMedica, { foreignKey: 'id_licencia' });

module.exports = ArchivoLicencia;
