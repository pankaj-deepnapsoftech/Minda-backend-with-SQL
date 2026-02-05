import { Sequelize, DataTypes } from "sequelize";
import { sequelize } from "../sequelize.js";

export const PlcProductModel = sequelize.define(
  "PlcProduct",
  {
    _id: {
      type: DataTypes.UUID,
      defaultValue: Sequelize.literal("NEWID()"),
      primaryKey: true,
    },
    material_code: { type: DataTypes.STRING(255), allowNull: true },
    material_description: { type: DataTypes.TEXT, allowNull: true },
    part_no: { type: DataTypes.STRING(255), allowNull: true },
    model_code: { type: DataTypes.STRING(255), allowNull: true },
    machine_name: { type: DataTypes.STRING(255), allowNull: true },
    company_name: { type: DataTypes.STRING(255), allowNull: true },
    plant_name: { type: DataTypes.STRING(255), allowNull: true },
    product_name: { type: DataTypes.STRING(255), allowNull: true },
  },
  {
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    tableName: "plc_products",
  }
);

PlcProductModel.prototype.toJSON = function () {
  const values = { ...this.get() };
  return values;
};
