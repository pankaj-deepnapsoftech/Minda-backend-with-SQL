import { TemplateMasterModel } from "../models/templateMaster.model.js";
import { UserModel } from "../models/user.modal.js";
import { WorkflowModel } from "../models/workflow.modal.js";
import {WorkflowApprovalModel} from "../models/workflowApproval.model.js"

export const CreateStatusHistoryService = async (data) => {
    // Model accepts only "approved" | "reject". Normalize "rejected" -> "reject"
    const payload = { ...data };
    if (payload.status && (payload.status === "rejected" || payload.status.toLowerCase() === "rejected")) {
        payload.status = "reject";
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