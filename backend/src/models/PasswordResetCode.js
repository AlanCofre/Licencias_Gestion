module.exports = (sequelize, DataTypes) => {
const PasswordResetCode = sequelize.define('PasswordResetCode', {
id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
code_hash: { type: DataTypes.STRING(255), allowNull: false },
expires_at: { type: DataTypes.DATE, allowNull: false },
used_at: { type: DataTypes.DATE, allowNull: true },
attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
}, {
tableName: 'password_reset_codes',
underscored: true,
});


PasswordResetCode.associate = (models) => {
PasswordResetCode.belongsTo(models.Usuario, { foreignKey: 'user_id' });
};


return PasswordResetCode;
};