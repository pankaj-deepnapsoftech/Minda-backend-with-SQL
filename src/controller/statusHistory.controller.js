import { AsyncHandler } from "../utils/asyncHandler.js";
import { CreateStatusHistoryService, getStatusHistoryById } from "../services/statusHistory.service.js"
import { StatusCodes } from "http-status-codes";
import { updateAssignedUserStatusService, updateTemplateMasterWithWorkflow } from "../services/templateMaster.service.js";


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

    if (check?.status === "rejected") {
        await updateTemplateMasterWithWorkflow(check?.template_id, { is_active: false });
        await updateAssignedUserStatusService(check?.template_id, { user_id: check?.user_id, status: "rejected" })
    }

    // const checkLatest = await getStatusHistoryById(result._id);

    // if (checkLatest?.status === "approved" && checkLatest?.workflow?.workflow?.length - 1 !== checkLatest?.current_stage) {
    //     if (checkLatest?.template?.assigned_users?.every((item) => item.status === "completed")) {
    //         await updateTemplateMasterWithWorkflow(check?.template_id, { is_active: false });
    //     }
    // }

    // console.log("Status History Created",check);
});