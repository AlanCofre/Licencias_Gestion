const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    dialect: 'mysql',
    logging: false,
  }
);

// Instanciamos modelos (factory)
const Rol = require('./modelo_Rol')(sequelize, DataTypes);
const Usuario = require('./modelo_Usuario')(sequelize, DataTypes);
const PasswordResetCode = require('./PasswordResetCode')(sequelize, DataTypes);

Rol.hasMany(Usuario, { foreignKey: 'id_rol' });
Usuario.belongsTo(Rol, { foreignKey: 'id_rol' });

PasswordResetCode.belongsTo(Usuario, { foreignKey: 'user_id', targetKey: 'id_usuario' });

module.exports = { sequelize, Usuario, Rol, PasswordResetCode };