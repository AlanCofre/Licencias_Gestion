// src/models/modelo_LicenciasEntregas.js
import { DataTypes, Model } from 'sequelize';
import sequelize from '../../db/sequelize.js';
import LicenciaMedica from './modelo_LicenciaMedica.js';
import Curso from './modelo_Curso.js';

class LicenciasEntregas extends Model {}

LicenciasEntregas.init(
  {
    id_entrega: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'id_entrega',
    },
    id_licencia: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'id_licencia',
      references: {
        model: LicenciaMedica,
        key: 'id_licencia',
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
    fecha_creacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'fecha_creacion',
    },
  },
  {
    sequelize,
    tableName: 'licencias_entregas',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['id_licencia', 'id_curso'],
        name: 'uq_licencia_curso',
      },
    ],
  }
);

// Asociaciones
LicenciasEntregas.belongsTo(LicenciaMedica, { 
  foreignKey: 'id_licencia',
  as: 'licencia'
});

LicenciasEntregas.belongsTo(Curso, { 
  foreignKey: 'id_curso',
  as: 'curso'
});

LicenciaMedica.hasMany(LicenciasEntregas, { 
  foreignKey: 'id_licencia',
  as: 'entregas'
});

Curso.hasMany(LicenciasEntregas, { 
  foreignKey: 'id_curso',
  as: 'licenciasEntregadas'
});

export default LicenciasEntregas;