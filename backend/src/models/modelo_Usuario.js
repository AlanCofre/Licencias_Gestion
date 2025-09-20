module.exports = (sequelize, DataTypes) => {
  const Usuario = sequelize.define('Usuario', {
    id_usuario: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    correo_usuario: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    nombre: { type: DataTypes.STRING(50), allowNull: false },
    contrasena: { type: DataTypes.STRING(100), allowNull: false },
    activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    password_changed_at: { type: DataTypes.DATE, allowNull: true },
    id_rol: { type: DataTypes.INTEGER, allowNull: true }, // si tu tabla lo tiene
  }, {
    tableName: 'usuario',
    timestamps: false, // tu tabla no tiene createdAt/updatedAt
    underscored: false,
  });

  return Usuario;
};