// backend/src/models/modelo_Matricula.js
import { DataTypes, Model } from 'sequelize';
import sequelize from '../../db/sequelize.js';
import Usuario from './modelo_Usuario.js';
import Curso from './modelo_Curso.js';

class Matricula extends Model {}

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
  },
  {
    sequelize,
    tableName: 'matriculas',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['id_usuario', 'id_curso', 'id_periodo'],
        name: 'uq_usuario_curso_periodo',
      },
    ],
    hooks: {
      // validación de que SEA estudiante
      beforeCreate: async (matricula) => {
        const usuario = await Usuario.findByPk(matricula.id_usuario);
        if (!usuario) {
          throw new Error('Usuario no encontrado');
        }
        // en tu BD: 2 = estudiante
        if (usuario.id_rol !== 2) {
          throw new Error('Solo los estudiantes pueden matricularse en cursos');
        }
      },
    },
  }
);

export default Matricula;
