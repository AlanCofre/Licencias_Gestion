import { Sequelize } from 'sequelize';

const db = new Sequelize('A2024_fsanchez', 'fsanchez', 'lJrDG86HVT.G2+.DN', {
  host: 'mysql.inf.uct.cl',
  dialect: 'mysql'
});

export default db;
