import { CheckListHistoryModal } from "../models/checkListHistory.modal.js"


export const createChecklistHistory = async (data) => {
    const result = await CheckListHistoryModal.insertMany(data);
    return result;
};





















