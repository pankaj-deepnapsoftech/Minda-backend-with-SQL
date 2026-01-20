import { StatusCodes } from "http-status-codes";
import { AsyncHandler } from "../utils/asyncHandler.js";
import {
  addFieldToTemplateService,
  createTemplateService,
  deleteFieldService,
  deleteTemplateService,
  getTemplateByIdService,
  listTemplatesService,
} from "../services/templateMaster.service.js";

export const createTemplate = AsyncHandler(async (req, res) => {
  const created = await createTemplateService(req.body);
  res.status(StatusCodes.CREATED).json({
    message: "Template created successfully",
    data: created,
  });
});

export const listTemplates = AsyncHandler(async (_req, res) => {
  const result = await listTemplatesService();
  res.status(StatusCodes.OK).json({
    message: "Templates fetched successfully",
    data: result,
  });
});

export const getTemplateById = AsyncHandler(async (req, res) => {
  const result = await getTemplateByIdService(req.params.id);
  res.status(StatusCodes.OK).json({
    message: "Template fetched successfully",
    data: result,
  });
});

export const addFieldToTemplate = AsyncHandler(async (req, res) => {
  const created = await addFieldToTemplateService(req.params.id, req.body);
  res.status(StatusCodes.CREATED).json({
    message: "Field added successfully",
    data: created,
  });
});

export const deleteField = AsyncHandler(async (req, res) => {
  await deleteFieldService(req.params.fieldId);
  res.status(StatusCodes.OK).json({
    message: "Field deleted successfully",
  });
});

export const deleteTemplate = AsyncHandler(async (req, res) => {
  await deleteTemplateService(req.params.id);
  res.status(StatusCodes.OK).json({
    message: "Template deleted successfully",
  });
});

