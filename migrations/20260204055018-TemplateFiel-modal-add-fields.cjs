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
    await queryInterface.addColumn("template_fields", "type", {
      type: Sequelize.ENUM("HOD",'User','Approval'),
      allowNull: true,
      defaultValue:'User'
    });
    await queryInterface.addColumn("template_fields", "group_id", {
      type: Sequelize.UUID,
      allowNull: true,
      references:{
        model:'relesegroups',
        key:'_id'
      },
      onUpdate:'CASCADE',
      onDelete:'SET NULL'
    });
  },

  async down (queryInterface) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn("template_fields", "type");
    await queryInterface.removeColumn("template_fields", "group_id");
  }
};
