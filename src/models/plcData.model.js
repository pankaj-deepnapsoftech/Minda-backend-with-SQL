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
    company_name: { type: DataTypes.STRING(255), allowNull: true },
    plant_name: { type: DataTypes.STRING(255), allowNull: true },
    line_number: { type: DataTypes.STRING(50), allowNull: true },
    device_id: { type: DataTypes.STRING(255), allowNull: true },
    timestamp: { type: DataTypes.DATE, allowNull: true },
    start_time: { type: DataTypes.DATE, allowNull: true },
    stop_time: { type: DataTypes.DATE, allowNull: true },
    status: { type: DataTypes.STRING(255), allowNull: true },
    latch_force: { type: DataTypes.INTEGER, allowNull: true },
    claw_force: { type: DataTypes.INTEGER, allowNull: true },
    safety_lever: { type: DataTypes.INTEGER, allowNull: true },
    claw_lever: { type: DataTypes.INTEGER, allowNull: true },
    stroke: { type: DataTypes.INTEGER, allowNull: true },
    production_count: { type: DataTypes.INTEGER, allowNull: true },
    model: { type: DataTypes.STRING(255), allowNull: true },
    alarm: { type: DataTypes.STRING(255), allowNull: true },
    extra_data: { type: DataTypes.JSON, allowNull: true }, // Dynamic fields - kitni bhi aaye, sab store
  },
  {
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    tableName: "plc_data",
  }
);

// Response structure: input JSON jaisa (companyname, parameters nested, etc.)
const PARAMS_MAP = {
  latch_force: "LATCH_FORCE",
  claw_force: "CLAW_FORCE",
  safety_lever: "SAFETY_LEVER",
  claw_lever: "CLAW_LEVER",
  stroke: "STROKE",
  production_count: "PRODUCTION_COUNT",
  alarm: "ALARM",
};

PlcDataModel.prototype.toJSON = function () {
  const values = { ...this.get() };
  let extra = values.extra_data || {};
  if (typeof extra === "string") {
    try {
      extra = JSON.parse(extra);
    } catch (_) {
      extra = {};
    }
  }

  const parameters = { ...extra };
  delete parameters.product; // product top-level pe, parameters m nahi
  for (const [dbCol, paramKey] of Object.entries(PARAMS_MAP)) {
    if (values[dbCol] !== undefined && values[dbCol] !== null) {
      parameters[paramKey] = values[dbCol];
    }
  }

  const product = values.product ?? extra.product ?? null;

  return {
    _id: values._id,
    companyname: values.company_name,
    plantname: values.plant_name,
    linenumber: values.line_number,
    device_id: values.device_id,
    timestamp: values.timestamp,
    Start_time: values.start_time,
    Stop_time: values.stop_time,
    Status: values.status,
    product,
    machine: values.model ? { model: values.model } : {},
    parameters,
    created_at: values.created_at,
    updated_at: values.updated_at,
  };
};
