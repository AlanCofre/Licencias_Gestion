const { DataTypes } = require('sequelize');
const db = require('../config/db');
const Usuario = require('./modelo_Usuario');

const Notificacion = db.define('Notificacion', {
  id_notificacion: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  asunto: { type: DataTypes.TEXT, allowNull: false },
  contenido: { type: DataTypes.TEXT, allowNull: false },
  leido: { type: DataTypes.BOOLEAN, defaultValue: false },
  fecha_envio: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'notificacion',
  timestamps: false
});

Usuario.hasMany(Notificacion, { foreignKey: 'id_usuario' });
Notificacion.belongsTo(Usuario, { foreignKey: 'id_usuario' });

module.exports = Notificacion;
