// Importa TODOS los modelos para que queden registrados en Sequelize
import Rol from './modelo_Rol.js';
import Usuario from './modelo_Usuario.js';
import LicenciaMedica from './modelo_LicenciaMedica.js';
import ArchivoLicencia from './modelo_ArchivoLicencia.js';
import Curso from './modelo_Curso.js';
import Notificacion from './modelo_Notificacion.js';
import HistorialLicencias from './modelo_HistorialLicencias.js';
import LogAuditoria from './modelo_LogAuditoria.js';

// 1) Rol ⇄ Usuario
Rol.hasMany(Usuario, { foreignKey: 'id_rol' });
Usuario.belongsTo(Rol, { foreignKey: 'id_rol' });
// (basado en tus modelos anteriores) :contentReference[oaicite:9]{index=9}

// 2) Usuario ⇄ LicenciaMedica
Usuario.hasMany(LicenciaMedica, { foreignKey: 'id_usuario' });
LicenciaMedica.belongsTo(Usuario, { foreignKey: 'id_usuario' });
// (igual que antes) :contentReference[oaicite:10]{index=10}

// 3) LicenciaMedica ⇄ ArchivoLicencia
LicenciaMedica.hasMany(ArchivoLicencia, { foreignKey: 'id_licencia', onDelete: 'CASCADE' });
ArchivoLicencia.belongsTo(LicenciaMedica, { foreignKey: 'id_licencia' });
// (igual que antes) :contentReference[oaicite:11]{index=11}

// 4) Usuario ⇄ Notificacion
Usuario.hasMany(Notificacion, { foreignKey: 'id_usuario' });
Notificacion.belongsTo(Usuario, { foreignKey: 'id_usuario' });
// (igual que antes) :contentReference[oaicite:12]{index=12}

// 5) Usuario ⇄ Curso
Usuario.hasMany(Curso, { foreignKey: 'id_usuario' });
Curso.belongsTo(Usuario, { foreignKey: 'id_usuario' });
// (igual que antes) :contentReference[oaicite:13]{index=13}

// 6) HistorialLicencias → LicenciaMedica y Usuario
HistorialLicencias.belongsTo(LicenciaMedica, { foreignKey: 'id_licencia' });
HistorialLicencias.belongsTo(Usuario, { foreignKey: 'id_usuario' });
// (antes también tenía FK a Estado; se elimina por nuevo diseño) :contentReference[oaicite:14]{index=14}

// 7) LogAuditoria → Usuario
Usuario.hasMany(LogAuditoria, { foreignKey: 'id_usuario' });
LogAuditoria.belongsTo(Usuario, { foreignKey: 'id_usuario' });
// (igual que antes) :contentReference[oaicite:15]{index=15}

export {
  Rol,
  Usuario,
  LicenciaMedica,
  ArchivoLicencia,
  Curso,
  Notificacion,
  HistorialLicencias,
  LogAuditoria
};
