import { StatusCodes } from "http-status-codes";
import { createChecklistHistory, findTodayChecklistHistory, GetCheckListHistory, UpdateCheckListHistory } from "../services/checklistHistory.service.js";
import { AsyncHandler } from "../utils/asyncHandler.js";
import { BadRequestError, NotFoundError } from "../utils/errorHandler.js";


export const createCheckListHistory = AsyncHandler(async (req, res) => {
  const { data } = req.body;
  const user_id = req.currentUser._id

  // 1️⃣ Validate request
  if (!Array.isArray(data) || data.length === 0) {
    throw new NotFoundError("Data array is required","createCheckListHistory() method error");
  }

  // 2️⃣ Find today's existing records
  const existingRecords = await findTodayChecklistHistory(data);

  // 3️⃣ Create lookup set
  const existingSet = new Set(
    existingRecords.map(
      item => `${item.checkList}_${item.process_id}_${item.assembly}`
    )
  );

  // 4️⃣ Filter new records only
  const filteredData = data.filter(item => {
    const key = `${item.checkList}_${item.process_id}_${item.assembly}`;
    return !existingSet.has(key);
  });

  // 5️⃣ If all already exist → error
  if (filteredData.length === 0) {
    throw new BadRequestError("All checklist history records already exist for today","createCheckListHistory() method error")
  }

  // 6️⃣ Insert only new records
  const result = await createChecklistHistory(filteredData.map((item)=>({...item,user_id})));

  // 7️⃣ Response
  res.status(StatusCodes.CREATED).json({
    message: "Checklist history saved successfully",
    insertedCount: result.length,
    skippedCount: data.length - result.length,
    data: result,
  });
});

export const updateCheckListHistory = AsyncHandler(async (req,res) => {
    const {id} = req.params;
    const data = req.body;
    const result = await UpdateCheckListHistory(id,data);
    if(!result){
        throw new NotFoundError("Data not found please try again","updateCheckListHistory() method error");
    };
    res.status(StatusCodes.OK).json({
        message:"Data updated successfully",
        data:result
    });
});

export const GetCheckHistoryData = AsyncHandler(async (req,res) => {
    const user = req.currentUser;
    let {page,limit} = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const skip  = (page -1) * limit;
    const result = await GetCheckListHistory(user?.is_admin,user?._id,skip,limit);
    res.status(StatusCodes.OK).json({
        data:result
    })
});






