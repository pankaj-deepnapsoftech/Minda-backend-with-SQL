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

    try {
      await queryInterface.addColumn("users", "hod_id", {
      type: Sequelize.UUID, allowNull: true, references: {
        model: "users",
        key: "_id"
      },
       onDelete: "SET NULL",
    })
    } catch (error) {
      console.log(error)
    }
     
  },

  async down (queryInterface) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    
    await queryInterface.removeColumn("users", "hod_id")
  }
};
