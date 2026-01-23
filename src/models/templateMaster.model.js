import { Sequelize, DataTypes } from "sequelize";
import { sequelize } from "../sequelize.js";

export const TemplateMasterModel = sequelize.define(
  "TemplateMaster",
  {
    _id: {
      type: DataTypes.UUID,
      defaultValue: Sequelize.literal("NEWID()"),
      primaryKey: true,
    },
    template_name: { type: DataTypes.STRING, allowNull: false, unique: true },
    template_type: { type: DataTypes.STRING, allowNull: true }, // NEW / AMENDMENT (optional)
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    assigned_user: { type: DataTypes.UUID, allowNull: true },
    workflow_id: { type: DataTypes.UUID, allowNull: true },
  },
  {
    timestamps: true,
    tableName: "template_masters",
  }
);

