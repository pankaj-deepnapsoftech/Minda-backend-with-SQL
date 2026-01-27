import {WorkflowApprovalModel} from "../models/workflowApproval.model.js"

export const CreateStatusHistoryService = async (data) => {
    const result = await WorkflowApprovalModel.create(data);
    return result;
}