import { CheckListHistoryModal } from "../models/checkListHistory.modal.js"


export const createChecklistHistory = async (data) => {
    const result = await CheckListHistoryModal.insertMany(data);
    return result;
};

export const findTodayChecklistHistory = async (data) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  return await CheckListHistoryModal.find(
    {
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      $or: data.map(item => ({
        checkList: item.checkList,
        process_id: item.process_id,
        assembly: item.assembly,
      })),
    },
    {
      checkList: 1,
      process_id: 1,
      assembly: 1,
      _id: 0,
    }
  );
};

export const UpdateCheckListHistory = async  (id,data) => {
    const result = await CheckListHistoryModal.findByIdAndUpdate(id,data,{new:true});
    return result
};

export const GetCheckListHistory = async (isadmin,user_id,skip,limit) => {
    const result = await CheckListHistoryModal.find(!isadmin ? {user_id} : {}).sort({_id:-1}).skip(skip).limit(limit).populate([
        {path:"checkList"},
        {path:"assembly",select:"assembly_name assembly_number"},
        {path:"process_id"},
        {path:"user_id",select:"full_name email desigination user_id"},
    ])
    return result;
};
















