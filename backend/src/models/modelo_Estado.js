const { DataTypes } = require('sequelize');
const db = require('../config/db');

const Estado = db.define('Estado', {
  id_estado: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  estado_nombre: { 
    type: DataTypes.ENUM('sin validar', 'en revisión', 'aprobada', 'rechazada'),
    allowNull: false
  }
}, {
  tableName: 'estado',
  timestamps: false
});

module.exports = Estado;
