'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn('template_submissions', 'plant_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'plants',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.removeColumn('template_submissions',"filled_by");
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('template_submissions', 'plant_id');

    await queryInterface.addColumn('template_submissions',"filled_by", {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: '_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  }
};
