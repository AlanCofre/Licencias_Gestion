const { DataTypes } = require('sequelize');
const db = require('../config/db');
const Usuario = require('./modelo_Usuario');
const LicenciaMedica = require('./modelo_LicenciaMedica');
const Estado = require('./modelo_Estado');

const HistorialLicencias = db.define('HistorialLicencias', {
  id_historial: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  observacion: { type: DataTypes.TEXT, allowNull: true },
  fecha_actualizacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'historial_licencias',
  timestamps: false
});

HistorialLicencias.belongsTo(LicenciaMedica, { foreignKey: 'id_licencia' });
HistorialLicencias.belongsTo(Usuario, { foreignKey: 'id_usuario' });
HistorialLicencias.belongsTo(Estado, { foreignKey: 'id_estado' });

module.exports = HistorialLicencias;
