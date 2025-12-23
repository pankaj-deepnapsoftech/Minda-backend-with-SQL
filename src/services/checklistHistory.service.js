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

export const UpdateCheckListHistory = async (id, data) => {
  const result = await CheckListHistoryModal.findByIdAndUpdate(id, data, { new: true });
  return result
};

export const GetAllErrorsHistory = async (admin, user) => {

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  const result = await CheckListHistoryModal.find(admin ? {
    is_error: true, createdAt: {
      $gte: startOfDay,
      $lte: endOfDay
    }
  } : {
    user_id: user, is_error: true, createdAt: {
      $gte: startOfDay,
      $lte: endOfDay
    }
  }).populate([
    {
      path: "checkList"
    },
    {
      path: "assembly",
    },
    {
      path: "process_id",
    },
  ])
  return result;
}

















