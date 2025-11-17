import Rol from './modelo_Rol.js';
import Usuario from './modelo_Usuario.js';
import LicenciaMedica from './modelo_LicenciaMedica.js';
import ArchivoLicencia from './modelo_ArchivoLicencia.js';
import Curso from './modelo_Curso.js';
import Notificacion from './modelo_Notificacion.js';
import HistorialLicencias from './modelo_HistorialLicencias.js';
import LogAuditoria from './modelo_LogAuditoria.js';
import LicenciasEntregas from './modelo_LicenciasEntregas.js';
import Matricula from './modelo_Matricula.js';
import Periodo from './modelo_Periodo.js';  
// 1) Rol ⇄ Usuario
Rol.hasMany(Usuario, { foreignKey: 'id_rol' });
Usuario.belongsTo(Rol, { foreignKey: 'id_rol' });

// 2) Usuario ⇄ LicenciaMedica
Usuario.hasMany(LicenciaMedica, {foreignKey: 'id_usuario', as: 'licenciasMedicas', onDelete: 'RESTRICT', onUpdate: 'CASCADE'});
LicenciaMedica.belongsTo(Usuario, { foreignKey: 'id_usuario', as: 'solicitante',onDelete: 'RESTRICT',onUpdate: 'CASCADE'});
// 3) LicenciaMedica ⇄ ArchivoLicencia
LicenciaMedica.hasMany(ArchivoLicencia, { foreignKey: 'id_licencia', onDelete: 'CASCADE' });
ArchivoLicencia.belongsTo(LicenciaMedica, { foreignKey: 'id_licencia' });

// 4) Usuario ⇄ Notificacion
Usuario.hasMany(Notificacion, { foreignKey: 'id_usuario' });
Notificacion.belongsTo(Usuario, { foreignKey: 'id_usuario' });

// 5) Usuario ⇄ Curso
Usuario.hasMany(Curso, { foreignKey: 'id_usuario', as: 'cursos', onDelete: 'RESTRICT', onUpdate: 'CASCADE' });
Curso.belongsTo(Usuario, { foreignKey: 'id_usuario', as: 'profesor', onDelete: 'RESTRICT',  onUpdate: 'CASCADE' });

// 6) HistorialLicencias → LicenciaMedica y Usuario
HistorialLicencias.belongsTo(LicenciaMedica, { foreignKey: 'id_licencia' });
HistorialLicencias.belongsTo(Usuario, { foreignKey: 'id_usuario' });

// 7) LogAuditoria → Usuario
Usuario.hasMany(LogAuditoria, { foreignKey: 'id_usuario' });
LogAuditoria.belongsTo(Usuario, { foreignKey: 'id_usuario' });

// 8) Nuevas asociaciones para LicenciasEntregas
LicenciaMedica.hasMany(LicenciasEntregas, { foreignKey: 'id_licencia', as: 'entregas'});
Curso.hasMany(LicenciasEntregas, { foreignKey: 'id_curso', as: 'licenciasEntregadas'});
LicenciasEntregas.belongsTo(LicenciaMedica, { foreignKey: 'id_licencia', as: 'licencia'});
LicenciasEntregas.belongsTo(Curso, { foreignKey: 'id_curso', as: 'curso'});

// 9) Nuevas asociaciones para Matriculas (Relación N-N Usuario-Curso)
Usuario.hasMany(Matricula, { foreignKey: 'id_usuario', as: 'matriculas', onDelete: 'RESTRICT', onUpdate: 'CASCADE' });
Curso.hasMany(Matricula, { foreignKey: 'id_curso', as: 'estudiantesMatriculados'});
Matricula.belongsTo(Usuario, { foreignKey: 'id_usuario', as: 'estudiante'});
Matricula.belongsTo(Curso, { foreignKey: 'id_curso',as: 'curso'});


// Asociación directa N-N entre Usuario y Curso a través de Matricula
Usuario.belongsToMany(Curso, { through: Matricula, foreignKey: 'id_usuario', otherKey: 'id_curso', as: 'cursosMatriculados', onDelete: 'RESTRICT', onUpdate: 'CASCADE' });
Curso.belongsToMany(Usuario, {through: Matricula, foreignKey: 'id_curso', otherKey: 'id_usuario', as: 'estudiantes' });

Periodo.hasMany(Curso, { foreignKey: 'id_periodo', as: 'cursos' });
Curso.belongsTo(Periodo, { foreignKey: 'id_periodo', as: 'periodo' });


export {
  Rol,
  Usuario,
  LicenciaMedica,
  ArchivoLicencia,
  Curso,
  Notificacion,
  HistorialLicencias,
  LogAuditoria,
  LicenciasEntregas,
  Matricula,
  Periodo
};
