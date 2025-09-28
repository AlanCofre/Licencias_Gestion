// src/models/modelo_LicenciaMedica.js
import { DataTypes, Model } from 'sequelize';
import sequelize from '../../db/sequelize.js';
import Usuario from './modelo_Usuario.js';

class LicenciaMedica extends Model {}

LicenciaMedica.init(
  {
    id_licencia: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    // FK explícita al usuario solicitante
    id_usuario: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: Usuario, key: 'id_usuario' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },

    folio: { type: DataTypes.STRING(50), allowNull: false },

    // Usa DATEONLY para no arrastrar hora/zona
    fecha_emision: { type: DataTypes.DATEONLY, allowNull: false },
    fecha_inicio: { type: DataTypes.DATEONLY, allowNull: false },
    fecha_fin: { type: DataTypes.DATEONLY, allowNull: false },

    estado: {
      type: DataTypes.ENUM('pendiente', 'aceptado', 'rechazado'),
      allowNull: false,
      defaultValue: 'pendiente',
    },

    // Observación en caso de rechazo
    motivo_rechazo: { type: DataTypes.TEXT, allowNull: true },

    // Marca de creación (si ya tienes createdAt/updatedAt, puedes borrar esto y usar timestamps: true)
    fecha_creacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'LicenciaMedica',
    timestamps: false, // Si tu tabla ya tiene createdAt/updatedAt, cambia a true y mapea underscored si aplica
    defaultScope: {
      order: [['fecha_creacion', 'DESC']],
    },
    validate: {
      // Rango de fechas coherente
      rangoFechasValido() {
        const ini = new Date(this.fecha_inicio);
        const fin = new Date(this.fecha_fin);
        if (ini > fin) {
          throw new Error('fecha_inicio no puede ser posterior a fecha_fin');
        }
      },
    },
    hooks: {
      // Reglas de negocio en creación
      beforeCreate(inst) {
        // Forzar pendiente en creación
        inst.estado = 'pendiente';

        // Si viene motivo_rechazo y NO está rechazado, limpiar
        if (inst.estado !== 'rechazado' && inst.motivo_rechazo) {
          inst.motivo_rechazo = null;
        }
      },

      // Reglas de negocio en actualización (estado y motivo)
      beforeUpdate(inst) {
        const prev = inst.previous('estado');
        const next = inst.estado;

        // Si no cambió estado, solo validar motivo_rechazo coherente
        if (prev === next) {
          if (next === 'rechazado' && !inst.motivo_rechazo) {
            throw new Error('motivo_rechazo es obligatorio cuando la licencia es rechazada');
          }
          if (next !== 'rechazado' && inst.motivo_rechazo) {
            inst.motivo_rechazo = null;
          }
          return;
        }

        // Transiciones válidas: pendiente → aceptado|rechazado
        const permitido =
          prev === 'pendiente' && (next === 'aceptado' || next === 'rechazado');

        if (!permitido) {
          throw new Error('Transición de estado no permitida');
        }

        // Si pasa a rechazado, exigir motivo
        if (next === 'rechazado' && !inst.motivo_rechazo) {
          throw new Error('motivo_rechazo es obligatorio cuando la licencia es rechazada');
        }

        // Si pasa a aceptado, limpiar motivo_rechazo
        if (next !== 'rechazado' && inst.motivo_rechazo) {
          inst.motivo_rechazo = null;
        }
      },
    },
  }
);

// Asociación (FK ya definida arriba)
LicenciaMedica.belongsTo(Usuario, { foreignKey: 'id_usuario' });

// Índices útiles (solo si usas sync; si ya tienes migraciones, crea el índice vía migration)
try {
  // No lanza error si existe en bases que sincronizan con Sequelize
  await LicenciaMedica.sync(); // opcional si usas sync en otra parte
  await sequelize.getQueryInterface().addIndex('LicenciaMedica', ['id_usuario'], {
    name: 'idx_licencia_medica_usuario',
  });
} catch (_) {
  // ignora si ya existen / usas migraciones
}

export default LicenciaMedica;
