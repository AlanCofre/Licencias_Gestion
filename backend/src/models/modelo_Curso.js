// backend/src/models/modelo_Curso.js
import { DataTypes, Model } from 'sequelize';
import sequelize from '../../db/sequelize.js';
import Usuario from './modelo_Usuario.js';

class Curso extends Model {}

Curso.init(
  {
    id_curso: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    codigo: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    nombre_curso: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    seccion: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    periodo: {
      type: DataTypes.STRING(10), // ej: '2025-1'
      allowNull: false,
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    // FK al profesor
    id_usuario: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Usuario,
        key: 'id_usuario',
      },
    },
  },
  {
    sequelize,
    modelName: 'Curso',
    tableName: 'curso', // 👈 si tu tabla es cursos, cámbiala aquí
    timestamps: false,
  }
);

export default Curso;
