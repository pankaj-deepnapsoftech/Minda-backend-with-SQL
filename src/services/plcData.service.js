import { PlcDataModel } from "../models/plcData.model.js";
import { NotFoundError, BadRequestError } from "../utils/errorHandler.js";
import { Op } from "sequelize";

export const createPlcDataService = async (data) => {
  // Handle new nested payload structure
  let device_id, timestamp, model, latch_force, claw_force, safety_lever, claw_lever, stroke, production_count;

  if (data.device_id || data.machine || data.parameters) {
    // New format: { device_id, timestamp, machine: { model }, parameters: { ... } }
    device_id = data.device_id || null;
    timestamp = data.timestamp ? new Date(data.timestamp) : null;
    model = data.machine?.model || null;
    
    const params = data.parameters || {};
    latch_force = params.LATCH_FORCE || null;
    claw_force = params.CLAW_FORCE || null;
    safety_lever = params.SAFETY_LEVER || null;
    claw_lever = params.CLAW_LEVER || null;
    stroke = params.STROKE || null;
    production_count = params.PRODUCTION_COUNT || params["PRODUCTION-COUNT"] || null;
  } else {
    // Old format: { LATCH_FORCE, CLAW_FORCE, ..., MODEL, "PRODUCTION-COUNT" }
    device_id = null;
    timestamp = null;
    model = data.MODEL || null;
    latch_force = data.LATCH_FORCE || null;
    claw_force = data.CLAW_FORCE || null;
    safety_lever = data.SAFETY_LEVER || null;
    claw_lever = data.CLAW_LEVER || null;
    stroke = data.STROKE || null;
    production_count = data["PRODUCTION-COUNT"] || data.PRODUCTION_COUNT || null;
  }

  const plcData = await PlcDataModel.create({
    device_id,
    timestamp,
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

  // Handle new nested payload structure
  if (data.device_id !== undefined) updateData.device_id = data.device_id;
  if (data.timestamp !== undefined) updateData.timestamp = new Date(data.timestamp);
  if (data.machine?.model !== undefined) updateData.model = data.machine.model;
  
  if (data.parameters) {
    const params = data.parameters;
    if (params.LATCH_FORCE !== undefined) updateData.latch_force = params.LATCH_FORCE;
    if (params.CLAW_FORCE !== undefined) updateData.claw_force = params.CLAW_FORCE;
    if (params.SAFETY_LEVER !== undefined) updateData.safety_lever = params.SAFETY_LEVER;
    if (params.CLAW_LEVER !== undefined) updateData.claw_lever = params.CLAW_LEVER;
    if (params.STROKE !== undefined) updateData.stroke = params.STROKE;
    if (params.PRODUCTION_COUNT !== undefined || params["PRODUCTION-COUNT"] !== undefined) {
      updateData.production_count = params.PRODUCTION_COUNT !== undefined ? params.PRODUCTION_COUNT : params["PRODUCTION-COUNT"];
    }
  } else {
    // Handle old flat format
    if (data.LATCH_FORCE !== undefined) updateData.latch_force = data.LATCH_FORCE;
    if (data.CLAW_FORCE !== undefined) updateData.claw_force = data.CLAW_FORCE;
    if (data.SAFETY_LEVER !== undefined) updateData.safety_lever = data.SAFETY_LEVER;
    if (data.CLAW_LEVER !== undefined) updateData.claw_lever = data.CLAW_LEVER;
    if (data.STROKE !== undefined) updateData.stroke = data.STROKE;
    if (data.PRODUCTION_COUNT !== undefined || data["PRODUCTION-COUNT"] !== undefined) {
      updateData.production_count = data.PRODUCTION_COUNT !== undefined ? data.PRODUCTION_COUNT : data["PRODUCTION-COUNT"];
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
