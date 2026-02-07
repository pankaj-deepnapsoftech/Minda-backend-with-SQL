'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const exists = await queryInterface.tableExists('plc_data');
    if (exists) return;

    await queryInterface.createTable('plc_data', {
      _id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('NEWID()'),
        primaryKey: true,
      },
      company_name: { type: Sequelize.STRING(255), allowNull: true },
      plant_name: { type: Sequelize.STRING(255), allowNull: true },
      line_number: { type: Sequelize.STRING(50), allowNull: true },
      device_id: { type: Sequelize.STRING(255), allowNull: true },
      timestamp: { type: Sequelize.DATE, allowNull: true },
      start_time: { type: Sequelize.DATE, allowNull: true },
      stop_time: { type: Sequelize.DATE, allowNull: true },
      status: { type: Sequelize.STRING(255), allowNull: true },
      latch_force: { type: Sequelize.INTEGER, allowNull: true },
      claw_force: { type: Sequelize.INTEGER, allowNull: true },
      safety_lever: { type: Sequelize.INTEGER, allowNull: true },
      claw_lever: { type: Sequelize.INTEGER, allowNull: true },
      stroke: { type: Sequelize.INTEGER, allowNull: true },
      production_count: { type: Sequelize.INTEGER, allowNull: true },
      model: { type: Sequelize.STRING(255), allowNull: true },
      alarm: { type: Sequelize.STRING(255), allowNull: true },
      extra_data: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('plc_data');
  },
};
