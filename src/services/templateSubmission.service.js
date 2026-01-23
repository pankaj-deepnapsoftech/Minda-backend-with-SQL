import { TemplateSubmissionModel } from "../models/templateSubmission.model.js";
import { TemplateMasterModel } from "../models/templateMaster.model.js";
import { BadRequestError, NotFoundError } from "../utils/errorHandler.js";
import { Op } from "sequelize";

export const createTemplateSubmissionService = async (data) => {
  const { template_id, user_id, form_data, status } = data;

  if (!template_id || !user_id) {
    throw new BadRequestError("Template ID and User ID are required", "createTemplateSubmissionService()");
  }

  // Verify template exists
  const template = await TemplateMasterModel.findByPk(template_id);
  if (!template) {
    throw new NotFoundError("Template not found", "createTemplateSubmissionService()");
  }

  // Check if submission already exists for this template and user
  const existingSubmission = await TemplateSubmissionModel.findOne({
    where: {
      template_id,
      user_id,
    },
  });

  if (existingSubmission) {
    if (existingSubmission.status === "SUBMITTED") {
      throw new BadRequestError("You have already submitted this template", "createTemplateSubmissionService()");
    }
    
    // Update existing draft
    await existingSubmission.update({
      form_data: form_data || {},
      status: status || "DRAFT",
    });
    return existingSubmission;
  }

  // Create new submission
  const submission = await TemplateSubmissionModel.create({
    template_id,
    user_id,
    form_data: form_data || {},
    status: status || "DRAFT",
  });

  return submission;
};

export const updateTemplateSubmissionService = async (submissionId, data) => {
  const submission = await TemplateSubmissionModel.findByPk(submissionId);
  if (!submission) {
    throw new NotFoundError("Submission not found", "updateTemplateSubmissionService()");
  }

  await submission.update({
    form_data: data.form_data !== undefined ? data.form_data : submission.form_data,
    status: data.status !== undefined ? data.status : submission.status,
  });

  return submission;
};

export const getTemplateSubmissionService = async (submissionId) => {
  const submission = await TemplateSubmissionModel.findByPk(submissionId, {
    include: [
      {
        model: TemplateMasterModel,
        as: "template",
        attributes: ["_id", "template_name", "template_type"],
      },
      {
        model: UserModel,
        as: "user",
        attributes: ["_id", "full_name", "email", "user_id"],
      },
    ],
  });

  if (!submission) {
    throw new NotFoundError("Submission not found", "getTemplateSubmissionService()");
  }

  return submission;
};

export const getUserTemplateSubmissionsService = async (userId, templateId = null) => {
  const where = { user_id: userId };
  if (templateId) {
    where.template_id = templateId;
  }

  const submissions = await TemplateSubmissionModel.findAll({
    where,
    include: [
      {
        model: TemplateMasterModel,
        as: "template",
        attributes: ["_id", "template_name", "template_type"],
      },
      {
        model: UserModel,
        as: "user",
        attributes: ["_id", "full_name", "email", "user_id"],
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  return submissions;
};

export const getLatestUserSubmissionForTemplateService = async (userId, templateId) => {
  const submission = await TemplateSubmissionModel.findOne({
    where: {
      user_id: userId,
      template_id: templateId,
    },
    order: [["createdAt", "DESC"]],
  });

  return submission;
};

export const submitTemplateSubmissionService = async (submissionId) => {
  const submission = await TemplateSubmissionModel.findByPk(submissionId);
  if (!submission) {
    throw new NotFoundError("Submission not found", "submitTemplateSubmissionService()");
  }

  await submission.update({
    status: "SUBMITTED",
  });

  return submission;
};
