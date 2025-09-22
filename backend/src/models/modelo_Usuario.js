// src/models/modelo_Usuario.js
module.exports = (sequelize, DataTypes) => {
  const Usuario = sequelize.define('Usuario', {
    id_usuario: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    correo_usuario: { type: DataTypes.STRING(50), unique: true, allowNull: false },
    nombre: { type: DataTypes.STRING(50), allowNull: false },
    contrasena: { type: DataTypes.STRING(100), allowNull: false },
    activo: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, {
    tableName: 'usuario',
    timestamps: false,
  });

  return Usuario;
};
