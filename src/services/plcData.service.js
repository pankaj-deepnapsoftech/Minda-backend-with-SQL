import { PlcDataModel } from "../models/plcData.model.js";
import { NotFoundError, BadRequestError } from "../utils/errorHandler.js";
import { Op } from "sequelize";

export const createPlcDataService = async (data) => {
  // New payload example:
  // {
  //   companyname, plantname, linenumber, device_id,
  //   timestamp, Start_time, Stop_time,
  //   machine: { model },
  //   parameters: { LATCH_FORCE, ... }
  // }

  const company_name = data.companyname || null;
  const plant_name = data.plantname || null;
  const line_number = data.linenumber || null;

  let device_id = null;
  let timestamp = null;
  let start_time = null;
  let stop_time = null;
  let model = null;
  let latch_force = null;
  let claw_force = null;
  let safety_lever = null;
  let claw_lever = null;
  let stroke = null;
  let production_count = null;

  if (data.device_id || data.machine || data.parameters) {
    // New nested format
    device_id = data.device_id || null;
    timestamp = data.timestamp ? new Date(data.timestamp) : null;
    start_time = data.Start_time ? new Date(data.Start_time) : null;
    stop_time = data.Stop_time ? new Date(data.Stop_time) : null;
    model = data.machine && data.machine.model ? data.machine.model : null;

    const params = data.parameters || {};
    latch_force = params.LATCH_FORCE ?? null;
    claw_force = params.CLAW_FORCE ?? null;
    safety_lever = params.SAFETY_LEVER ?? null;
    claw_lever = params.CLAW_LEVER ?? null;
    stroke = params.STROKE ?? null;
    production_count = params.PRODUCTION_COUNT ?? params["PRODUCTION-COUNT"] ?? null;
  } else {
    // Support older flat format for backward compatibility
    device_id = data.device_id || null;
    timestamp = data.timestamp ? new Date(data.timestamp) : null;
    model = data.MODEL || data.model || null;
    latch_force = data.LATCH_FORCE ?? null;
    claw_force = data.CLAW_FORCE ?? null;
    safety_lever = data.SAFETY_LEVER ?? null;
    claw_lever = data.CLAW_LEVER ?? null;
    stroke = data.STROKE ?? null;
    production_count = data["PRODUCTION-COUNT"] ?? data.PRODUCTION_COUNT ?? null;
  }

  const plcData = await PlcDataModel.create({
    company_name,
    plant_name,
    line_number,
    device_id,
    timestamp,
    start_time,
    stop_time,
    latch_force,
    claw_force,
    safety_lever,
    claw_lever,
    stroke,
    production_count,
    model,
  });

  return plcData;
};

export const getAllPlcDataService = async (filters = {}) => {
  const where = {};

  if (filters.device_id) {
    where.device_id = { [Op.like]: `%${filters.device_id}%` };
  }

  if (filters.model) {
    where.model = { [Op.like]: `%${filters.model}%` };
  }

  if (filters.startDate && filters.endDate) {
    where.created_at = {
      [Op.between]: [filters.startDate, filters.endDate],
    };
  }

  if (filters.timestampStart && filters.timestampEnd) {
    where.timestamp = {
      [Op.between]: [filters.timestampStart, filters.timestampEnd],
    };
  }

  const plcDataList = await PlcDataModel.findAll({
    where,
    order: [["created_at", "DESC"]],
  });

  return plcDataList;
};

export const getPlcDataByIdService = async (id) => {
  const plcData = await PlcDataModel.findByPk(id);
  if (!plcData) {
    throw new NotFoundError("PLC Data not found", "getPlcDataByIdService()");
  }
  return plcData;
};

export const updatePlcDataService = async (id, data) => {
  const plcData = await PlcDataModel.findByPk(id);
  if (!plcData) {
    throw new NotFoundError("PLC Data not found", "updatePlcDataService()");
  }

  const updateData = {};

  if (data.companyname !== undefined) updateData.company_name = data.companyname;
  if (data.plantname !== undefined) updateData.plant_name = data.plantname;
  if (data.linenumber !== undefined) updateData.line_number = data.linenumber;

  // Handle new nested payload structure
  if (data.device_id !== undefined) updateData.device_id = data.device_id;
  if (data.timestamp !== undefined) updateData.timestamp = new Date(data.timestamp);
  if (data.Start_time !== undefined) updateData.start_time = new Date(data.Start_time);
  if (data.Stop_time !== undefined) updateData.stop_time = new Date(data.Stop_time);
  if (data.machine && data.machine.model !== undefined) updateData.model = data.machine.model;

  if (data.parameters) {
    const params = data.parameters;
    if (params.LATCH_FORCE !== undefined) updateData.latch_force = params.LATCH_FORCE;
    if (params.CLAW_FORCE !== undefined) updateData.claw_force = params.CLAW_FORCE;
    if (params.SAFETY_LEVER !== undefined) updateData.safety_lever = params.SAFETY_LEVER;
    if (params.CLAW_LEVER !== undefined) updateData.claw_lever = params.CLAW_LEVER;
    if (params.STROKE !== undefined) updateData.stroke = params.STROKE;
    if (params.PRODUCTION_COUNT !== undefined || params["PRODUCTION-COUNT"] !== undefined) {
      updateData.production_count =
        params.PRODUCTION_COUNT !== undefined ? params.PRODUCTION_COUNT : params["PRODUCTION-COUNT"];
    }
  } else {
    // Handle old flat format
    if (data.LATCH_FORCE !== undefined) updateData.latch_force = data.LATCH_FORCE;
    if (data.CLAW_FORCE !== undefined) updateData.claw_force = data.CLAW_FORCE;
    if (data.SAFETY_LEVER !== undefined) updateData.safety_lever = data.SAFETY_LEVER;
    if (data.CLAW_LEVER !== undefined) updateData.claw_lever = data.CLAW_LEVER;
    if (data.STROKE !== undefined) updateData.stroke = data.STROKE;
    if (data.PRODUCTION_COUNT !== undefined || data["PRODUCTION-COUNT"] !== undefined) {
      updateData.production_count =
        data.PRODUCTION_COUNT !== undefined ? data.PRODUCTION_COUNT : data["PRODUCTION-COUNT"];
    }
    if (data.MODEL !== undefined) updateData.model = data.MODEL;
  }

  await plcData.update(updateData);

  return plcData;
};

export const deletePlcDataService = async (id) => {
  const plcData = await PlcDataModel.findByPk(id);
  if (!plcData) {
    throw new NotFoundError("PLC Data not found", "deletePlcDataService()");
  }

  await plcData.destroy();
  return true;
};
