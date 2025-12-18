import { StatusCodes } from "http-status-codes";
import { createChecklistHistory } from "../services/checklistHistory.service.js";
import { AsyncHandler } from "../utils/asyncHandler.js";


export const createCheckListHistory = AsyncHandler(async (req,res) => {
    const data = req.body.data;
    const result = await createChecklistHistory(data);
    res.status(StatusCodes.CREATED).json({
        message:"Data Save Successfully",
        data:result
    });
});

