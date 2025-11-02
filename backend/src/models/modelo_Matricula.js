
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
      validate: {
        // Validación para asegurar que el usuario tenga rol de estudiante
        async esEstudiante(value) {
          const usuario = await Usuario.findByPk(value, {
            include: ['rol']
          });
          if (!usuario || usuario.rol.nombre_rol !== 'estudiante') {
            throw new Error('Solo los estudiantes pueden matricularse en cursos');
          }
        }
      }
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
        fields: ['id_usuario', 'id_curso'],
        name: 'uq_usuario_curso',
      },
    ],
    hooks: {
      beforeCreate: async (matricula) => {
        // Verificar que el usuario sea estudiante
        const usuario = await Usuario.findByPk(matricula.id_usuario, {
          include: ['rol']
        });
        
        if (!usuario) {
          throw new Error('Usuario no encontrado');
        }
        
        if (usuario.rol.nombre_rol !== 'estudiante') {
          throw new Error('Solo los estudiantes pueden matricularse en cursos');
        }
      }
    }
  }
);

export default Matricula;