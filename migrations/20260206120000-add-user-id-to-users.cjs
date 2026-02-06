'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'user_id', {
      type: Sequelize.STRING(50),
      allowNull: true,
      unique: true
    });
  },

  async down (queryInterface) {
    await queryInterface.removeColumn('users', 'user_id');
  }
};
