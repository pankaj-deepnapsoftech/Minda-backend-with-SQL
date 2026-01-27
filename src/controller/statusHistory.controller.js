import { AsyncHandler } from "../utils/asyncHandler.js";
import {CreateStatusHistoryService, getStatusHistoryById} from "../services/statusHistory.service.js"
import { StatusCodes } from "http-status-codes";
import { updateAssignedUserStatusService, updateTemplateMasterWithWorkflow } from "../services/templateMaster.service.js";


export const createStatusHistory = AsyncHandler(async (req,res) => {
    const data = req.body;
    const user = req.currentUser;
    const result = await CreateStatusHistoryService({...data,approved_by:user._id});
    const check = await getStatusHistoryById(result._id);
    res.status(StatusCodes.CREATED).json({
        data:result,
        message:"Template Status Initiated",
        check
    });

    if(check?.workflow?.workflow?.length -1 === check?.current_stage && check?.status === "approved"){
        await  updateTemplateMasterWithWorkflow(check?.template_id);
        await updateAssignedUserStatusService(check?.template_id,{user_id:check?.user_id,status:"approved"})
    }
    
    // console.log("Status History Created",check);
});