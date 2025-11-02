import { sequelize, DataTypes } from '../../db/sequelize.js';
import Rol from './modelo_Rol.js';
import Usuario from './modelo_Usuario.js';
import LicenciaMedica from './modelo_LicenciaMedica.js';
import ArchivoLicencia from './modelo_ArchivoLicencia.js';
import Curso from './modelo_Curso.js';
import Notificacion from './modelo_Notificacion.js';
import HistorialLicencias from './modelo_HistorialLicencias.js';
import LogAuditoria from './modelo_LogAuditoria.js';
import modeloLicenciasEntregas from './modelo_LicenciasEntregas.js';
import modeloMatricula from './modelo_matriculas.js';
import LicenciasEntregas from './modelo_LicenciasEntregas.js';

// Instanciar modelos
const Matricula = modeloMatricula(sequelize, DataTypes);

// 1) Rol ⇄ Usuario
Rol.hasMany(Usuario, { foreignKey: 'id_rol' });
Usuario.belongsTo(Rol, { foreignKey: 'id_rol' });

// 2) Usuario ⇄ LicenciaMedica
Usuario.hasMany(LicenciaMedica, { foreignKey: 'id_usuario' });
LicenciaMedica.belongsTo(Usuario, { foreignKey: 'id_usuario' });

// 3) LicenciaMedica ⇄ ArchivoLicencia
LicenciaMedica.hasMany(ArchivoLicencia, { foreignKey: 'id_licencia', onDelete: 'CASCADE' });
ArchivoLicencia.belongsTo(LicenciaMedica, { foreignKey: 'id_licencia' });

// 4) Usuario ⇄ Notificacion
Usuario.hasMany(Notificacion, { foreignKey: 'id_usuario' });
Notificacion.belongsTo(Usuario, { foreignKey: 'id_usuario' });

// 5) Usuario ⇄ Curso
Usuario.hasMany(Curso, { foreignKey: 'id_usuario', as: 'cursosImpartidos' });
Curso.belongsTo(Usuario, { foreignKey: 'id_usuario', as: 'profesor' });

// 6) HistorialLicencias → LicenciaMedica y Usuario
HistorialLicencias.belongsTo(LicenciaMedica, { foreignKey: 'id_licencia' });
HistorialLicencias.belongsTo(Usuario, { foreignKey: 'id_usuario' });

// 7) LogAuditoria → Usuario
Usuario.hasMany(LogAuditoria, { foreignKey: 'id_usuario' });
LogAuditoria.belongsTo(Usuario, { foreignKey: 'id_usuario' });

// 8) LicenciaMedica ⇄ Curso (a través de LicenciasEntregas)
LicenciaMedica.hasMany(LicenciasEntregas, { foreignKey: 'id_licencia', as: 'entregasLicencia' });
Curso.hasMany(LicenciasEntregas, { foreignKey: 'id_curso', as: 'cursoEntregas' });
LicenciasEntregas.belongsTo(LicenciaMedica, { foreignKey: 'id_licencia', as: 'licenciaAsociada' });
LicenciasEntregas.belongsTo(Curso, { foreignKey: 'id_curso', as: 'cursoEntrega' });

// 9) Usuario ⇄ Curso (a través de Matricula)
Usuario.hasMany(Matricula, { foreignKey: 'id_usuario', as: 'matriculas' });
Curso.hasMany(Matricula, { foreignKey: 'id_curso', as: 'estudiantesMatriculados' });
Matricula.belongsTo(Usuario, { foreignKey: 'id_usuario', as: 'estudiante' });
Matricula.belongsTo(Curso, { foreignKey: 'id_curso', as: 'curso' });

Usuario.belongsToMany(Curso, {
  through: Matricula,
  foreignKey: 'id_usuario',
  otherKey: 'id_curso',
  as: 'cursosMatriculados'
});
Curso.belongsToMany(Usuario, {
  through: Matricula,
  foreignKey: 'id_curso',
  otherKey: 'id_usuario',
  as: 'estudiantes'
});

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
  Matricula
};
