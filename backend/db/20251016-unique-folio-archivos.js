export async function up(queryInterface, Sequelize) {
  // 1) Normalizar: NOT NULL
  await queryInterface.changeColumn('archivo_licencias', 'folio', {
    type: Sequelize.STRING(64),
    allowNull: false,
  });

  // 2) Eliminar duplicados simples (si aplica)
  // *Opcional: hazlo en una migración previa/controlada por script*

  // 3) Índice único
  await queryInterface.addConstraint('archivo_licencias', {
    fields: ['folio'],
    type: 'unique',
    name: 'uq_archivo_licencias_folio',
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeConstraint('archivo_licencias', 'uq_archivo_licencias_folio');
  await queryInterface.changeColumn('archivo_licencias', 'folio', {
    type: Sequelize.STRING(64),
    allowNull: true,
  });
}
