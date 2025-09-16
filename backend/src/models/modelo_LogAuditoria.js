const { DataTypes } = require('sequelize');
const db = require('../config/db');
const Usuario = require('./modelo_Usuario');

const LogAuditoria = db.define('LogAuditoria', {
  id_log: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  accion: { 
    type: DataTypes.ENUM('crear', 'actualizar', 'eliminar', 'ver'),
    allowNull: false 
  },
  recurso: { type: DataTypes.STRING(50), allowNull: false }, // ej: usuario, licencia, notificación
  payload: { type: DataTypes.STRING(50), allowNull: true },  // información del cambio
  ip: { type: DataTypes.STRING(50), allowNull: true },
  fecha: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'log_auditoria',
  timestamps: false
});

Usuario.hasMany(LogAuditoria, { foreignKey: 'id_usuario' });
LogAuditoria.belongsTo(Usuario, { foreignKey: 'id_usuario' });

module.exports = LogAuditoria;
