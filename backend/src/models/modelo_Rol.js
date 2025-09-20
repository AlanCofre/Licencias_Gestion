module.exports = (sequelize, DataTypes) => {
  const Rol = sequelize.define('Rol', {
    id_rol: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre_rol: {
      type: DataTypes.ENUM('estudiante', 'funcionario', 'admin'),
      allowNull: false,
    },
    descripcion: { type: DataTypes.TEXT, allowNull: true },
  }, {
    tableName: 'rol',
    timestamps: false,
  });

  return Rol;
};