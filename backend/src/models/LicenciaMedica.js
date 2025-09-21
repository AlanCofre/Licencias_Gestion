module.exports = (sequelize, DataTypes) => {
  const LicenciaMedica = sequelize.define("LicenciaMedica", {
    id_licencia: { type: DataTypes.INTEGER, primaryKey:true, autoIncrement:true },
    folio: { type: DataTypes.STRING(50), allowNull:false },
    fecha_emision: { type: DataTypes.DATEONLY, allowNull:true },
    fecha_inicio: { type: DataTypes.DATEONLY, allowNull:false, validate:{ isDate:true } },
    fecha_fin: { type: DataTypes.DATEONLY, allowNull:false, validate:{ isDate:true } },
    estado: { 
      type: DataTypes.ENUM("Pendiente","En revisión","Aprobada","Rechazada"),
      allowNull:false,
      defaultValue: "Pendiente"
    },
    motivo_rechazo: { type: DataTypes.STRING(300), allowNull:true },
    fecha_creacion: { type: DataTypes.DATE, allowNull:false, defaultValue: DataTypes.NOW },
    id_usuario: { type: DataTypes.INTEGER, allowNull:false }
  }, {
    tableName: "licenciamedica",
    timestamps: false // ya tienes fecha_creacion
  });

  // Validaciones cruzadas
  LicenciaMedica.addHook("beforeValidate", (lic) => {
    if (lic.fecha_inicio && lic.fecha_fin) {
      const ini = new Date(lic.fecha_inicio);
      const fin = new Date(lic.fecha_fin);
      if (ini > fin) throw new Error("fecha_inicio no puede ser posterior a fecha_fin");
      const MS = 24*60*60*1000;
      const dias = Math.ceil((fin - ini)/MS) + 1;
      if (dias > 90) throw new Error("La licencia no puede exceder 90 días");
    }
    if (lic.estado === "Rechazada" && !lic.motivo_rechazo) {
      throw new Error("Debe indicar motivo_rechazo cuando estado = Rechazada");
    }
    if (lic.estado !== "Rechazada" && lic.motivo_rechazo) {
      throw new Error("motivo_rechazo solo se usa cuando estado = Rechazada");
    }
  });

  return LicenciaMedica;
};
