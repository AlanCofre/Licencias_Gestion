import sequelize from './sequelize.js';

export async function checkDb() {
  // Autentica contra el servidor y revisa credenciales
  await sequelize.authenticate();

  // Si quisieras un ping más “manual”, también sirve:
  // await sequelize.query('SELECT 1');
}
