import { TemplateMasterModel } from "../models/templateMaster.model.js";
import { UserModel } from "../models/user.modal.js";
import { WorkflowModel } from "../models/workflow.modal.js";
import {WorkflowApprovalModel} from "../models/workflowApproval.model.js"

export const CreateStatusHistoryService = async (data) => {
    const result = await WorkflowApprovalModel.create(data);
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