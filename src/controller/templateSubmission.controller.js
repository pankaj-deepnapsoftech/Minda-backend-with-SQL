import { StatusCodes } from "http-status-codes";
import { AsyncHandler } from "../utils/asyncHandler.js";
import {
  createTemplateSubmissionService,
  updateTemplateSubmissionService,
  getTemplateSubmissionService,
  getUserTemplateSubmissionsService,
  getLatestUserSubmissionForTemplateService,
  submitTemplateSubmissionService,
} from "../services/templateSubmission.service.js";
import { updateAssignedUserStatusService, UpdateOnlyTemplateMaster } from "../services/templateMaster.service.js";

export const createTemplateSubmission = AsyncHandler(async (req, res,next) => {
  const userId = req.currentUser._id;
  const { template_id, form_data, status } = req.body;

  const result = await createTemplateSubmissionService({
    template_id,
    user_id: userId,
    form_data,
    status,
  });

  res.status(StatusCodes.CREATED).json({
    message: "Template submission saved successfully",
    data: result,
  });

   await updateAssignedUserStatusService(template_id, { user_id:userId, status: "in-progress"});


});

export const updateTemplateSubmission = AsyncHandler(async (req, res) => {
  const { id } = req.params;
  const { form_data, status } = req.body;

  const result = await updateTemplateSubmissionService(id, {
    form_data,
    status,
  });

  return res.status(StatusCodes.OK).json({
    message: "Template submission updated successfully",
    data: result,
  });
});

export const getTemplateSubmission = AsyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await getTemplateSubmissionService(id);

  return res.status(StatusCodes.OK).json({
    message: "Template submission fetched successfully",
    data: result,
  });
});

export const getUserTemplateSubmissions = AsyncHandler(async (req, res) => {
  const userId = req.currentUser._id;
  const { template_id } = req.query;

  const result = await getUserTemplateSubmissionsService(userId, template_id || null);

  return res.status(StatusCodes.OK).json({
    message: "Template submissions fetched successfully",
    data: result,
  });
});

export const getLatestUserSubmissionForTemplate = AsyncHandler(async (req, res) => {
  const userId = req.currentUser._id;
  const { template_id } = req.params;

  const result = await getLatestUserSubmissionForTemplateService(userId, template_id);

  return res.status(StatusCodes.OK).json({
    message: "Latest template submission fetched successfully",
    data: result,
  });
});

export const submitTemplateSubmission = AsyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await submitTemplateSubmissionService(id);

  return res.status(StatusCodes.OK).json({
    message: "Template submitted successfully",
    data: result,
  });
});
