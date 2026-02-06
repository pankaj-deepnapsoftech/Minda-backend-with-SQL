'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {

    // 1. Add plant_id column
    await queryInterface.addColumn('template_submissions', 'plant_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'plants',
        key: '_id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

  
  },

  async down(queryInterface) {

    // 2. Remove plant_id
    await queryInterface.removeColumn('template_submissions', 'plant_id');
  },
};
