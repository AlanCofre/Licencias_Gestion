import sequelize from './sequelize.js';

export async function checkDb() {
  await sequelize.authenticate();
  // Alternativa: await sequelize.query('SELECT 1');
}
