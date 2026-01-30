import { AsyncHandler } from "../utils/asyncHandler.js";
import { CreateStatusHistoryService, getStatusHistoryById } from "../services/statusHistory.service.js"
import { StatusCodes } from "http-status-codes";
import { getTemplateWorkflowStatusService, updateAssignedUserStatusService } from "../services/templateMaster.service.js";
import { GetAdmin, GetUsersByIdService } from "../services/users.service.js";
import { sendTemplateApprovalNotification } from "../helper/SendEmail.js";
import { logger } from "../utils/logger.js";
import { WorkflowApprovalModel } from "../models/workflowApproval.model.js";


export const createStatusHistory = AsyncHandler(async (req, res) => {
    const data = req.body;
    const user = req.currentUser;
    const result = await CreateStatusHistoryService({ ...data, approved_by: user._id });
    const check = await getStatusHistoryById(result._id);
    res.status(StatusCodes.CREATED).json({
        data: result,
        message: "Template Status Initiated",
        check
    });

    if (check?.workflow?.workflow?.length - 1 === check?.current_stage && check?.status === "approved") {
        await updateAssignedUserStatusService(check?.template_id, { user_id: check?.user_id, status: "completed" })
    }

    if (check?.status === "approved" && check?.template_id && check?.user_id && check?.approved_by) {
        const updated = await WorkflowApprovalModel.update(
            { reassign_status: true },
            {
                where: {
                    template_id: check.template_id,
                    user_id: check.user_id,
                    status: "reassigned",
                    reassign_user_id: check.approved_by,
                    reassign_status: false,
                },
            }
        );
        if (updated[0] > 0) {
            logger.info("Reassign approved: updated reassign_status to true for template", check.template_id);
        }
    }

    if (check?.status === "reject" || check?.status === "rejected") {
        await updateAssignedUserStatusService(check?.template_id, { user_id: check?.user_id, status: "rejected" })
    }

    if (check?.status === "reassigned" && check?.template_id && check?.user_id) {
        await updateAssignedUserStatusService(check.template_id, { user_id: check.user_id, status: "re-assign" });
    }

    // Notify admin every time; if approved, notify next approver; if reassigned, notify reassign_user_id
    try {
        const templateName = check?.template?.template_name || "Template";
        const assignee = check?.user_id ? await GetUsersByIdService(check.user_id) : null;
        const submittedByName = assignee?.full_name || "";
        const admin = await GetAdmin();

        if (admin?.email) {
            await sendTemplateApprovalNotification(
                admin.email,
                admin.full_name,
                templateName,
                submittedByName
            );
        }

        if (check?.status === "reassigned" && check?.reassign_user_id) {
            const reassignToUser = await GetUsersByIdService(check.reassign_user_id);
            if (reassignToUser?.email) {
                await sendTemplateApprovalNotification(
                    reassignToUser.email,
                    reassignToUser.full_name,
                    templateName,
                    submittedByName
                );
                logger.info("Reassign notification sent to:", reassignToUser.email);
            }
        }

        const steps = check?.workflow?.workflow || [];
        const nextStageIndex = check?.current_stage != null ? check.current_stage + 1 : null;
        const hasNextStage = steps.length > 0 && nextStageIndex != null && nextStageIndex < steps.length;
        if (check?.status === "approved" && hasNextStage && check?.template_id && check?.user_id) {
            const workflowStatus = await getTemplateWorkflowStatusService(check.template_id, check.user_id);
            const chain = workflowStatus?.chain || [];
            const nextApproverEntry = chain.find((c) => c.stage_index === nextStageIndex);
            const nextApproverUserId = nextApproverEntry?.user_id;
            if (nextApproverUserId) {
                const nextApprover = await GetUsersByIdService(nextApproverUserId);
                if (nextApprover?.email) {
                    await sendTemplateApprovalNotification(
                        nextApprover.email,
                        nextApprover.full_name,
                        templateName,
                        submittedByName
                    );
                }
            }
        }
    } catch (err) {
        logger.error("Approval notification email error:", err);
    }
});