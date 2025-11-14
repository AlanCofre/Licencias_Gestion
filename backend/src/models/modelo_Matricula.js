// backend/src/models/modelo_Matricula.js
import { DataTypes, Model } from 'sequelize';
import sequelize from '../../db/sequelize.js';
import Usuario from './modelo_Usuario.js';
import Curso from './modelo_Curso.js';

class Matricula extends Model {}

// backend/src/models/modelo_Matricula.js
Matricula.init(
  {
    id_matricula: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'id_matricula',
    },
    id_usuario: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'id_usuario',
      references: {
        model: Usuario,
        key: 'id_usuario',
      },
    },
    id_curso: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'id_curso',
      references: {
        model: Curso,
        key: 'id_curso',
      },
    },
    fecha_matricula: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'fecha_matricula',
    },
    periodo: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: '2025-1',
      field: 'periodo',
    },
  },
  {
    sequelize,
    tableName: 'matriculas',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['id_usuario', 'id_curso', 'periodo'],
        name: 'uq_usuario_curso_periodo',
      },
    ],
  }
);
export default Matricula;
