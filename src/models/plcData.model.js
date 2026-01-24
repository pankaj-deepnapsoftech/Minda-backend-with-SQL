import { Sequelize, DataTypes } from "sequelize";
import { sequelize } from "../sequelize.js";

export const PlcDataModel = sequelize.define(
  "PlcData",
  {
    _id: {
      type: DataTypes.UUID,
      defaultValue: Sequelize.literal("NEWID()"),
      primaryKey: true,
    },
    device_id: { type: DataTypes.STRING(255), allowNull: true },
    timestamp: { type: DataTypes.DATE, allowNull: true },
    latch_force: { type: DataTypes.INTEGER, allowNull: true },
    claw_force: { type: DataTypes.INTEGER, allowNull: true },
    safety_lever: { type: DataTypes.INTEGER, allowNull: true },
    claw_lever: { type: DataTypes.INTEGER, allowNull: true },
    stroke: { type: DataTypes.INTEGER, allowNull: true },
    production_count: { type: DataTypes.INTEGER, allowNull: true },
    model: { type: DataTypes.STRING(255), allowNull: true },
  },
  {
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    tableName: "plc_data",
  }
);

PlcDataModel.prototype.toJSON = function () {
  const values = { ...this.get() };
  return values;
};
