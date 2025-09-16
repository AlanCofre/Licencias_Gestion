const { DataTypes } = require('sequelize');
const db = require('../config/db');

const Rol = db.define('Rol', {
  id_rol: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre_rol: { type: DataTypes.ENUM('estudiante', 'funcionario', 'admin'), allowNull: false },
  descripcion: { type: DataTypes.TEXT, allowNull: true }
}, {
  tableName: 'rol',
  timestamps: false
});

module.exports = Rol;
