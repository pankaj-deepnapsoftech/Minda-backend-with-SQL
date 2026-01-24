import { StatusCodes } from "http-status-codes";
import { AsyncHandler } from "../utils/asyncHandler.js";
import {
  addFieldToTemplateService,
  createTemplateService,
  deleteFieldService,
  deleteTemplateService,
  getTemplateByIdService,
  listTemplatesService,
  updateFieldService,
  updateTemplateService,
  getAssignedTemplatesService,
  getTemplateStatusListService,
  assignWorkflowToTemplateService,
  updateAssignedUserStatusService,
  GetTemplateAssignModuleService,
  testing,
} from "../services/templateMaster.service.js";
import { getAllUsersUnderHod} from "../services/users.service.js";

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

export const updateTemplate = AsyncHandler(async (req, res) => {
  const result = await updateTemplateService(req.params.id, req.body);
  res.status(StatusCodes.OK).json({
    message: "Template updated successfully",
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

export const updateField = AsyncHandler(async (req, res) => {
  const result = await updateFieldService(req.params.fieldId, req.body);
  res.status(StatusCodes.OK).json({
    message: "Field updated successfully",
    data: result,
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

export const getAssignedTemplates = AsyncHandler(async (req, res) => {
  const userId = req.currentUser._id;
  const result = await getAssignedTemplatesService(userId);
  res.status(StatusCodes.OK).json({
    message: "Assigned templates fetched successfully",
    data: result,
  });
});

export const getTemplateStatusList = AsyncHandler(async (_req, res) => {
  const result = await getTemplateStatusListService();
  res.status(StatusCodes.OK).json({
    message: "Template status list fetched successfully",
    data: result,
  });
});

export const assignWorkflowToTemplate = AsyncHandler(async (req, res) => {
  const { templateId } = req.params;
  const { workflowId } = req.body;
  const result = await assignWorkflowToTemplateService(templateId, workflowId);
  res.status(StatusCodes.OK).json({
    message: workflowId ? "Workflow assigned successfully" : "Workflow unassigned successfully",
    data: result,
  });
});

export const updateAssignedUserStatus = AsyncHandler(async (req, res) => {
  const { id: templateId } = req.params;
  const { user_id, status } = req.body;
  const result = await updateAssignedUserStatusService(templateId, { user_id, status });
  res.status(StatusCodes.OK).json({
    message: "Assigned user status updated",
    data: result,
  });
});

export const getAseeignTempaleteWorkflow = AsyncHandler(async (req,res) =>{
  const user = req.currentUser;
  const data = await testing(user._id)
  // const newData =  await getAllUsersUnderHod(user._id)
  // const data = await GetTemplateAssignModuleService(newData);
  res.status(StatusCodes.OK).json({
    data
  })
});




