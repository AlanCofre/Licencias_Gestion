import { DataTypes, Model } from 'sequelize';
import sequelize from '../../db/sequelize.js';
import Perfil from './modelo_Perfil.js'; // Import de la relación 1:1

class Usuario extends Model {}

Usuario.init(
  {
    id_usuario: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    correo_usuario: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: {
          msg: 'El correo_usuario debe ser un email válido'
        }
      }
    },
    nombre: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    contrasena: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  },
  {
    sequelize,
    modelName: 'Usuario',
    tableName: 'usuario',   // Nombre exacto de tu tabla en MySQL
    timestamps: false       // Tu tabla usuario no tiene created_at/updated_at
  }
);

// ============================
// Asociaciones
// ============================

// Un Usuario tiene un único Perfil
Usuario.hasOne(Perfil, {
  foreignKey: 'id_usuario',
  as: 'perfil',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

// Un Perfil pertenece a un Usuario
Perfil.belongsTo(Usuario, {
  foreignKey: 'id_usuario',
  as: 'usuario'
});

export default Usuario;
