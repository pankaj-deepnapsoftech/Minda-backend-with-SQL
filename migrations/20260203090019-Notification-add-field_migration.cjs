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
    await queryInterface.addColumn("notifications",'type',{
      type:Sequelize.STRING(20),
      allowNull:false,
      defaultValue:"checklist_error",
      validate:{
        isIn:[["checklist_error","template_approval"]]
      }
    }),

    await queryInterface.addColumn("notifications",'template_id',{
      type:Sequelize.UUID,
      allowNull:true
    }),
    
    await queryInterface.addColumn("notifications",'template_name',{
      type:Sequelize.STRING(255),
      allowNull:true
    });
  },

  async down (queryInterface) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn("notifications",'type');
    await queryInterface.removeColumn("notifications",'template_id');
    await queryInterface.removeColumn("notifications",'template_name');
  }
};
