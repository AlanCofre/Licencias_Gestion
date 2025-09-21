// src/models/index.js
const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  // OJO: usa la misma variable que tengas en .env (DB_PASSWORD o DB_PASS)
  process.env.DB_PASSWORD || process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    dialect: 'mysql',
    logging: false,
  }
);

// ===== Modelos =====
const Rol = require('./modelo_Rol')(sequelize, DataTypes);
const Usuario = require('./modelo_Usuario')(sequelize, DataTypes);
const PasswordResetCode = require('./PasswordResetCode')(sequelize, DataTypes);
const LicenciaMedica = require('./LicenciaMedica')(sequelize, DataTypes); // 👈 NUEVO

// ===== Asociaciones =====
Rol.hasMany(Usuario, { foreignKey: 'id_rol' });
Usuario.belongsTo(Rol, { foreignKey: 'id_rol' });

// Password reset
PasswordResetCode.belongsTo(Usuario, { foreignKey: 'user_id', targetKey: 'id_usuario' });

// Licencias médicas
Usuario.hasMany(LicenciaMedica, { foreignKey: 'id_usuario', sourceKey: 'id_usuario' }); // 👈 NUEVO
LicenciaMedica.belongsTo(Usuario, { foreignKey: 'id_usuario', targetKey: 'id_usuario' }); // 👈 NUEVO

// (Opcional) Debug rápido para ver modelos cargados
// console.log('[models]', Object.keys(sequelize.models));

module.exports = {
  sequelize,
  Usuario,
  Rol,
  PasswordResetCode,
  LicenciaMedica, // 👈 EXPORTA el modelo
};
