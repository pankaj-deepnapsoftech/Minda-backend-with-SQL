'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('workflow_approvals');
    if (!tableDescription.approved_by) {
      await queryInterface.addColumn('workflow_approvals', 'approved_by', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: '_id',
        },
      });
    }
  },

  async down(queryInterface) {
    const tableDescription = await queryInterface.describeTable('workflow_approvals');
    if (tableDescription.approved_by) {
      await queryInterface.removeColumn('workflow_approvals', 'approved_by');
    }
  },
};
