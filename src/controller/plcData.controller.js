import { StatusCodes } from "http-status-codes";
import { AsyncHandler } from "../utils/asyncHandler.js";
import {
  createPlcDataService,
  getAllPlcDataService,
  getPlcDataByIdService,
  updatePlcDataService,
  deletePlcDataService,
} from "../services/plcData.service.js";

export const createPlcData = AsyncHandler(async (req, res) => {
  const result = await createPlcDataService(req.body);
  res.status(StatusCodes.CREATED).json({
    message: "PLC Data created successfully",
    data: result,
  });
});

export const getAllPlcData = AsyncHandler(async (req, res) => {
  const { device_id, model, status, startDate, endDate, timestampStart, timestampEnd } = req.query;
  const filters = {};
  
  if (device_id) filters.device_id = device_id;
  if (model) filters.model = model;
  if (status) filters.status = status;
  if (startDate) filters.startDate = startDate;
  if (endDate) filters.endDate = endDate;
  if (timestampStart) filters.timestampStart = timestampStart;
  if (timestampEnd) filters.timestampEnd = timestampEnd;

  const result = await getAllPlcDataService(filters);
  res.status(StatusCodes.OK).json({
    message: "PLC Data fetched successfully",
    data: result,
  });
});

export const getPlcDataById = AsyncHandler(async (req, res) => {
  const result = await getPlcDataByIdService(req.params.id);
  res.status(StatusCodes.OK).json({
    message: "PLC Data fetched successfully",
    data: result,
  });
});

export const updatePlcData = AsyncHandler(async (req, res) => {
  const result = await updatePlcDataService(req.params.id, req.body);
  res.status(StatusCodes.OK).json({
    message: "PLC Data updated successfully",
    data: result,
  });
});

export const deletePlcData = AsyncHandler(async (req, res) => {
  await deletePlcDataService(req.params.id);
  res.status(StatusCodes.OK).json({
    message: "PLC Data deleted successfully",
  });
});
