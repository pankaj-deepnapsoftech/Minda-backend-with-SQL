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
import { getTemplateWorkflowStatusService, updateAssignedUserStatusService } from "../services/templateMaster.service.js";
import { GetAdmin, GetUsersByIdService } from "../services/users.service.js";
import { sendTemplateApprovalNotification } from "../helper/SendEmail.js";
import { logger } from "../utils/logger.js";

export const createTemplateSubmission = AsyncHandler(async (req, res) => {
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

  // Notify first approver + admin when template is submitted for approval
  try {
    const templateId = result.template_id ?? result.get?.("template_id");
    const userId = result.user_id ?? result.get?.("user_id");
    if (!templateId || !userId) {
      logger.warn("Submit notification skipped: missing template_id or user_id on submission");
      return res.status(StatusCodes.OK).json({
        message: "Template submitted successfully",
        data: result,
      });
    }

    const workflowStatus = await getTemplateWorkflowStatusService(templateId, userId);
    const chain = workflowStatus?.chain || [];
    const templateName = workflowStatus?.template_name || "Template";
    const submitter = await GetUsersByIdService(userId);
    const submittedByName = submitter?.full_name || "";
    const admin = await GetAdmin();

    // Always send to admin when template is submitted
    if (admin?.email) {
      await sendTemplateApprovalNotification(
        admin.email,
        admin.full_name,
        templateName,
        submittedByName
      );
      logger.info("Submit notification sent to admin:", admin.email);
    } else {
      logger.warn("Submit notification: no admin user found (is_admin: true)");
    }

    // Send to submitter's HOD (user ka jo HOD hai uski mail pe bhejo)
    const hodId = submitter?.hod_id ?? submitter?.get?.("hod_id");
    if (hodId) {
      const hodUser = await GetUsersByIdService(hodId);
      if (hodUser?.email) {
        await sendTemplateApprovalNotification(
          hodUser.email,
          hodUser.full_name,
          templateName,
          submittedByName
        );
        logger.info("Submit notification sent to HOD:", hodUser.email);
      }
    } else {
      logger.warn("Submit notification: submitter has no hod_id, skipping HOD email");
    }

    // Also send to first approver from workflow if different from HOD (e.g. workflow step 0)
    if (chain.length > 0) {
      const firstApproverUserId = chain[0].user_id;
      const isSameAsHod = hodId && String(firstApproverUserId) === String(hodId);
      if (!isSameAsHod) {
        const firstApprover = firstApproverUserId ? await GetUsersByIdService(firstApproverUserId) : null;
        if (firstApprover?.email) {
          await sendTemplateApprovalNotification(
            firstApprover.email,
            firstApprover.full_name,
            templateName,
            submittedByName
          );
          logger.info("Submit notification sent to first approver:", firstApprover.email);
        }
      }
    }
  } catch (err) {
    logger.error("Submit approval notification email error:", err);
  }

  return res.status(StatusCodes.OK).json({
    message: "Template submitted successfully",
    data: result,
  });
});
