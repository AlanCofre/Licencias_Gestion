import { DataTypes, Model } from 'sequelize';
import sequelize from '../../db/sequelize.js';

class ArchivoLicencia extends Model {}

ArchivoLicencia.init(
  {
    id_archivo: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    ruta_url: { type: DataTypes.STRING(4096), allowNull: false },
    tipo_mime: { type: DataTypes.STRING(100), allowNull: false },
    hash: { type: DataTypes.STRING(128), allowNull: false },
    tamano: { type: DataTypes.INTEGER, allowNull: false },
    fecha_subida: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  },
  { sequelize, tableName: 'archivo_licencia', timestamps: false }
);

export default ArchivoLicencia;
