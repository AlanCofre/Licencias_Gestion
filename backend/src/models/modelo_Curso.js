const { DataTypes } = require('sequelize');
const db = require('../config/db');
const Usuario = require('./modelo_Usuario');

const Curso = db.define('Curso', {
  id_curso: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  codigo: { type: DataTypes.STRING(50), allowNull: false },
  nombre_curso: { type: DataTypes.STRING(100), allowNull: false },
  semestre: { type: DataTypes.ENUM('1', '2'), allowNull: false },
  seccion: { type: DataTypes.ENUM('1', '2', '3', '4'), allowNull: false }
}, {
  tableName: 'curso',
  timestamps: false
});

Usuario.hasMany(Curso, { foreignKey: 'id_usuario' });
Curso.belongsTo(Usuario, { foreignKey: 'id_usuario' });

module.exports = Curso;
