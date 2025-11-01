// backend/src/models/modelo_Matricula.js
export default (sequelize, DataTypes) => {
  const modeloMatricula = sequelize.define('Matricula', {
    id_matricula: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_usuario: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    id_curso: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    fecha_matricula: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'matriculas',
    timestamps: false
  });

  return modeloMatricula;
};
