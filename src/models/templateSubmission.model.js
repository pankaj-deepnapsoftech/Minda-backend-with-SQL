import { Sequelize, DataTypes } from "sequelize";
import { sequelize } from "../sequelize.js";

export const TemplateSubmissionModel = sequelize.define(
  "TemplateSubmission",
  {
    _id: {
      type: DataTypes.UUID,
      defaultValue: Sequelize.literal("NEWID()"),
      primaryKey: true,
    },
    template_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "template_masters",
        key: "_id",
      },
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "_id",
      },
    },
    form_data: {
      type: DataTypes.TEXT,
      allowNull: false,
      get() {
        const value = this.getDataValue("form_data");
        try {
          return value ? JSON.parse(value) : {};
        } catch {
          return {};
        }
      },
      set(value) {
        this.setDataValue("form_data", JSON.stringify(value));
      },
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "DRAFT", // DRAFT, SUBMITTED
    },
    edit_count:{
      type:DataTypes.NUMBER,
      allowNull:true,
      defaultValue:0
    }
  },
  {
    timestamps: true,
    tableName: "template_submissions",
    indexes: [
      { fields: ["template_id"] },
      { fields: ["user_id"] },
      { fields: ["status"] },
      { fields: ["template_id", "user_id"] },
    ],
  }
);
