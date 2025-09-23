import { DataTypes, Model } from 'sequelize';
import sequelize from '../../db/sequelize.js';

class Curso extends Model {}

Curso.init(
  {
    id_curso: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    codigo: { type: DataTypes.STRING(50), allowNull: false },
    nombre_curso: { type: DataTypes.STRING(100), allowNull: false },
    semestre: { type: DataTypes.ENUM('1', '2'), allowNull: false },
    seccion: { type: DataTypes.ENUM('1', '2', '3', '4'), allowNull: false }
  },
  { sequelize, tableName: 'curso', timestamps: false }
);

export default Curso;
