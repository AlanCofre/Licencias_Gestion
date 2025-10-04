// backend/src/models/modelo_ArchivoLicencia.js
import { DataTypes } from 'sequelize';
import sequelize from '../../db/sequelize.js'; // o donde tengas la instancia
import LicenciaMedica from './modelo_LicenciaMedica.js';

const ArchivoLicencia = sequelize.define('ArchivoLicencia', {
  id_archivo:     { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  ruta_url:       { type: DataTypes.STRING, allowNull: false },
  tipo_mime:      { type: DataTypes.STRING, allowNull: true },
  hash:           { type: DataTypes.STRING, allowNull: true },
  tamano:         { type: DataTypes.INTEGER, allowNull: true },
  fecha_subida:   { type: DataTypes.DATE, allowNull: true },
  id_licencia:    { type: DataTypes.INTEGER, allowNull: false }
}, {
  tableName: 'ArchivoLicencia',   // <<--- nombre REAL en MySQL
  freezeTableName: true,          // no pluraliza
  timestamps: false,
  underscored: false
});

// asociación (si no la tenías)
ArchivoLicencia.belongsTo(LicenciaMedica, { foreignKey: 'id_licencia', as: 'licencia' });

export default ArchivoLicencia;
