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

// DB column -> param key for response (parameters kitne bhi add ho skte h)
const PARAMS_MAP = {
  latch_force: "LATCH_FORCE",
  claw_force: "CLAW_FORCE",
  safety_lever: "SAFETY_LEVER",
  claw_lever: "CLAW_LEVER",
  stroke: "STROKE",
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

  // parameters: sab dynamic params extra_data se + known DB cols
  const parameters = { ...extra };
  delete parameters.product; // product alag field me
  delete parameters.PRODUCTION_COUNT; // production_count top-level pe
  for (const [dbCol, paramKey] of Object.entries(PARAMS_MAP)) {
    if (values[dbCol] !== undefined && values[dbCol] !== null) {
      parameters[paramKey] = values[dbCol];
    }
  }

  // product: plc_products se (attachProductToPlcData) ya extraFields.product se
  const product = values.product ?? extra.product ?? null;

  // extraFields: nested objects (e.g. product with model, material_code, part_no)
  const extraFields = {};
  if (extra.product && typeof extra.product === "object") {
    extraFields.product = extra.product;
  }
  // koi bhi aur nested extra field add ho to yahan aayega
  Object.keys(extra).forEach((k) => {
    if (k !== "product" && extra[k] && typeof extra[k] === "object" && !Array.isArray(extra[k])) {
      extraFields[k] = extra[k];
    }
  });

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
    production_count: values.production_count ?? extra.PRODUCTION_COUNT ?? null,
    machine: values.model ? { model: values.model } : {},
    parameters,
    extraFields: Object.keys(extraFields).length ? extraFields : undefined,
    created_at: values.created_at,
    updated_at: values.updated_at,
  };
};
