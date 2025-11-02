// src/models/modelo_Curso.js
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../db/sequelize.js';
import Usuario from './modelo_Usuario.js';

class Curso extends Model {}

Curso.init(
  {
    id_curso: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    codigo: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'El código del curso no puede estar vacío' },
        len: { args: [1, 20], msg: 'El código debe tener entre 1 y 20 caracteres' }
      }
    },
    nombre_curso: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'El nombre del curso no puede estar vacío' },
        len: { args: [1, 100], msg: 'El nombre debe tener entre 1 y 100 caracteres' }
      }
    },
    semestre: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: { args: 1, msg: 'El semestre debe ser al menos 1' },
        max: { args: 10, msg: 'El semestre no puede ser mayor a 10' },
        isInt: { msg: 'El semestre debe ser un número entero' }
      }
    },
    seccion: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: '1',
      validate: {
        notEmpty: { msg: 'La sección no puede estar vacía' },
        len: { args: [1, 10], msg: 'La sección debe tener entre 1 y 10 caracteres' }
      }
    },
    periodo: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: '2025-1',
      validate: {
        notEmpty: { msg: 'El período no puede estar vacío' },
        is: {
          args: /^\d{4}-[1-2]$/,
          msg: 'El período debe tener el formato YYYY-N (ej: 2025-1)'
        }
      }
    },
    id_usuario: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: Usuario, key: 'id_usuario' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    }
  },
  {
    sequelize,
    tableName: 'curso',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['codigo', 'seccion', 'periodo'],
        name: 'uq_curso_seccion_periodo'
      }
    ],
    hooks: {
      beforeValidate: (curso) => {
        if (curso.periodo && curso.semestre) {
          const [year, semester] = curso.periodo.split('-');
          const semestreNum = parseInt(curso.semestre);
          if (semestreNum > 2) {
            // Validaciones para semestres superiores
          }
        }
      }
    }
  }
);

Curso.belongsTo(Usuario, { foreignKey: 'id_usuario', as: 'docente' });
Usuario.hasMany(Curso, { foreignKey: 'id_usuario', as: 'cursos' });

export default Curso;
