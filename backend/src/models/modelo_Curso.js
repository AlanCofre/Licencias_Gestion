// backend/src/models/modelo_Curso.js
import { DataTypes, Model } from 'sequelize';
import sequelize from '../../db/sequelize.js';
import Usuario from './modelo_Usuario.js';
import Periodo from './modelo_Periodo.js';

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
    semestre: {
      type: DataTypes.TINYINT,
      allowNull: false,
    },
    seccion: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    id_periodo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Periodo,
        key: 'id_periodo',
      },
    },
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
    tableName: 'curso',
    timestamps: false,
  }
);

Curso.belongsTo(Usuario, { foreignKey: 'id_usuario' });
Curso.belongsTo(Periodo, { foreignKey: 'id_periodo' });

export default Curso;
