import { DataTypes } from 'sequelize';
import sequelize from '../database/sequelize.js';

const ArchivoLicencia = sequelize.define('ArchivoLicencia', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  licencia_id: { type: DataTypes.INTEGER, allowNull: false },
  folio: {
    type: DataTypes.STRING(64),
    allowNull: false,
    unique: true, // Unicidad a nivel de ORM (además del índice único en BD)
    validate: {
      notEmpty: true,
      len: [1, 64],
    },
  },
  nombre_archivo: { type: DataTypes.STRING(255), allowNull: false },
  url: { type: DataTypes.TEXT, allowNull: false },
}, {
  tableName: 'archivolicencia',
  underscored: true,
});

export default ArchivoLicencia;
