// src/models/Licencia.js
module.exports = (sequelize, DataTypes) => {
  const Licencia = sequelize.define('Licencia', {
    id_licencia: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_usuario: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    fecha_inicio: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    fecha_fin: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    tipo: {
      type: DataTypes.STRING(50),
      allowNull: true, // déjalo opcional si no lo usan ahora
    },
    motivo: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    estado: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'PENDIENTE',
    },
  }, {
    tableName: 'Licencia',
    underscored: true, // si usas snake_case en BD
  });

  Licencia.associate = (models) => {
    Licencia.belongsTo(models.Usuario, {
      foreignKey: 'id_usuario',
      as: 'Usuario',
    });
  };

  return Licencia;
};
