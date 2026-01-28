import { StatusCodes } from "http-status-codes";
import { AsyncHandler } from "../utils/asyncHandler.js";
import {
  createPlcProductService,
  getAllPlcProductsService,
  getPlcProductByIdService,
  updatePlcProductService,
  deletePlcProductService,
} from "../services/plcProduct.service.js";

export const createPlcProduct = AsyncHandler(async (req, res) => {
  const result = await createPlcProductService(req.body);
  res.status(StatusCodes.CREATED).json({
    message: "PLC Product created successfully",
    data: result,
  });
});

export const getAllPlcProducts = AsyncHandler(async (req, res) => {
  const { search, machine_name } = req.query;
  const filters = {};

  if (search) filters.search = search;
  if (machine_name) filters.machine_name = machine_name;

  const result = await getAllPlcProductsService(filters);
  res.status(StatusCodes.OK).json({
    message: "PLC Products fetched successfully",
    data: result,
  });
});

export const getPlcProductById = AsyncHandler(async (req, res) => {
  const result = await getPlcProductByIdService(req.params.id);
  res.status(StatusCodes.OK).json({
    message: "PLC Product fetched successfully",
    data: result,
  });
});

export const updatePlcProduct = AsyncHandler(async (req, res) => {
  const result = await updatePlcProductService(req.params.id, req.body);
  res.status(StatusCodes.OK).json({
    message: "PLC Product updated successfully",
    data: result,
  });
});

export const deletePlcProduct = AsyncHandler(async (req, res) => {
  await deletePlcProductService(req.params.id);
  res.status(StatusCodes.OK).json({
    message: "PLC Product deleted successfully",
  });
});
