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
    assigned_user: { type: DataTypes.UUID, allowNull: true }, // Keep for backward compatibility
    // status:{type:DataTypes.ENUM("pending","completed","rejected","re-assign",'in-progress'),allowNull:true,defaultValue:"pending"},
    assigned_users: { 
      type: DataTypes.TEXT, 
      allowNull: true,
      get() {
        const value = this.getDataValue("assigned_users");
        if (!value) return [];
        try {
          return JSON.parse(value);
        } catch {
          return [];
        }
      },
      set(value) {
        if (value === null || value === undefined) {
          this.setDataValue("assigned_users", null);
        } else if (Array.isArray(value) && value.length > 0) {
          this.setDataValue("assigned_users", JSON.stringify(value));
        } else if (Array.isArray(value) && value.length === 0) {
          this.setDataValue("assigned_users", null);
        } else {
          this.setDataValue("assigned_users", JSON.stringify([value]));
        }
      },
    },
    workflow_id: { type: DataTypes.UUID, allowNull: true },
  },
  {
    timestamps: true,
    tableName: "template_masters",
  }
);

