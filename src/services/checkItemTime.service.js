import { ItemCheckTimeModel } from "../models/itemCheckTime.model.js"




export const createChecklistItemTimeService = async (data) => {
    const result = await ItemCheckTimeModel.bulkCreate(data);
    return result;
}






















