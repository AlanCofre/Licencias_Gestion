// src/models/modelo_HistorialLicencias.js
import { DataTypes, Model } from 'sequelize';
import sequelize from '../../db/sequelize.js';
import LicenciaMedica from './modelo_LicenciaMedica.js';
import Usuario from './modelo_Usuario.js';

class HistorialLicencias extends Model {}

HistorialLicencias.init(
  {
    id_historial: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'id_historial',
    },
    // Atributo "estado" mapeado a columna "estado_actual"
    estado: {
      type: DataTypes.ENUM('pendiente', 'aceptado', 'rechazado'),
      allowNull: false,
      field: 'estado_actual',
    },
    observacion: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'observacion',
    },
    fecha_actualizacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'fecha_actualizacion',
    },
    // FKs presentes en BD
    id_licencia: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'id_licencia',
    },
    id_usuario: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'id_usuario',
    },
  },
  {
    sequelize,
    tableName: 'historiallicencias', // <- igual a la BD
    timestamps: false,
  }
);

// Asociaciones (opcional pero recomendable)
HistorialLicencias.belongsTo(LicenciaMedica, { foreignKey: 'id_licencia' });
HistorialLicencias.belongsTo(Usuario, { foreignKey: 'id_usuario' });

export default HistorialLicencias;
