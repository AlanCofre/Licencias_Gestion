const { DataTypes } = require('sequelize');
const db = require('../config/db');
const Usuario = require('./modelo_Usuario');
const LicenciaMedica = db.define('LicenciaMedica', {
  id_licencia: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  folio: { type: DataTypes.STRING(50), allowNull: false },
  fecha_inicio: { type: DataTypes.DATE, allowNull: false },
  fecha_fin: { type: DataTypes.DATE, allowNull: false },
  motivo_rechazo: { type: DataTypes.TEXT, allowNull: true },
  fecha_creacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  estado_licencia: {
    type: DataTypes.ENUM('sin validar', 'en revisión', 'aprobada', 'rechazada'),
    allowNull: false,
    defaultValue: 'sin validar'
  }
}, {
  tableName: 'licencia_medica',
  timestamps: false
});

Usuario.hasMany(LicenciaMedica, { foreignKey: 'id_usuario' });
LicenciaMedica.belongsTo(Usuario, { foreignKey: 'id_usuario' });

module.exports = LicenciaMedica;
