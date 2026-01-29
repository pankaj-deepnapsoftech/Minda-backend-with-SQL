import { TemplateMasterModel } from "../models/templateMaster.model.js";
import { UserModel } from "../models/user.modal.js";
import { WorkflowModel } from "../models/workflow.modal.js";
import { WorkflowApprovalModel } from "../models/workflowApproval.model.js";
import { BadRequestError } from "../utils/errorHandler.js";

const VALID_STATUSES = ["approved", "rejected"];

export const CreateStatusHistoryService = async (data) => {
    // Model accepts only "approved" | "rejected". Normalize incoming status
    const payload = { ...data };
    const s = (payload.status || "").toString().trim().toLowerCase();
    if (s === "reject" || s === "rejected") {
        payload.status = "rejected";
    } else if (s === "approved" || s === "approve") {
        payload.status = "approved";
    } else if (!payload.status) {
        throw new BadRequestError("status is required (approved or rejected)", "CreateStatusHistoryService()");
    } else {
        throw new BadRequestError(`status must be one of: ${VALID_STATUSES.join(", ")}. Received: ${payload.status}`, "CreateStatusHistoryService()");
    }
    const result = await WorkflowApprovalModel.create(payload);
    return result;
};

export const getStatusHistoryById = async (id) => {
     const result = await WorkflowApprovalModel.findOne({
        where:{_id:id},
        include:[
        //  {model:UserModel,as:"approved_by_user"},
         {model:TemplateMasterModel,as:"template"},
         {model:WorkflowModel,as:"workflow"},
         {model:UserModel,as:"user"}
     ]
     });
     return result;
   
}