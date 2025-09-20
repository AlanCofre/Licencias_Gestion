module.exports = (sequelize, DataTypes) => {
  const License = sequelize.define("License", {
    id: { type: DataTypes.INTEGER, primaryKey:true, autoIncrement:true },
    studentId: { type: DataTypes.INTEGER, allowNull:false },
    tipo: { type: DataTypes.ENUM("Reposo","Intervención","Control","Otro"), allowNull:false },
    motivo: { type: DataTypes.STRING(200), allowNull:false },
    descripcion: { type: DataTypes.TEXT, allowNull:true },
    fecha_inicio: { type: DataTypes.DATEONLY, allowNull:false, validate: { isDate:true } },
    fecha_fin: { type: DataTypes.DATEONLY, allowNull:false, validate: { isDate:true } },
    archivo_url: { type: DataTypes.STRING(500), allowNull:true },
  }, {
    tableName: "licencia", // usa tu nombre real de tabla
    underscored: true
  });

  // Validación cruzada a nivel de instancia
  License.addHook("beforeValidate", (lic) => {
    if (lic.fecha_inicio && lic.fecha_fin) {
      const ini = new Date(lic.fecha_inicio);
      const fin = new Date(lic.fecha_fin);
      if (ini > fin) {
        throw new Error("fecha_inicio no puede ser posterior a fecha_fin");
      }
      const MS_DIA = 24*60*60*1000;
      const dias = Math.ceil((fin - ini)/MS_DIA) + 1;
      if (dias > 90) {
        throw new Error("La licencia no puede exceder 90 días");
      }
    }
  });

  return License;
};
