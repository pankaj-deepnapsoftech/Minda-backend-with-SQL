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
  let {
    device_id,
    model,
    status,
    startDate,
    endDate,
    timestampStart,
    timestampEnd,
    page,
    limit
  } = req.query;

  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;
  const offset = (page - 1) * limit;

  const filters = {};

  if (device_id) filters.device_id = device_id;
  if (model) filters.model = model;
  if (status) filters.status = status;
  if (startDate && endDate) {
    filters.startDate = startDate;
    filters.endDate = endDate;
  }
  if (timestampStart && timestampEnd) {
    filters.timestampStart = timestampStart;
    filters.timestampEnd = timestampEnd;
  }

  const result = await getAllPlcDataService(filters, { limit, offset });

  res.status(StatusCodes.OK).json({
    message: "PLC Data fetched successfully",
    data: result,
    page,
    limit
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
