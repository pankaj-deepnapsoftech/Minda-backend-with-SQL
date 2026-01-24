import { AsyncHandler } from "../utils/asyncHandler.js";
import {CreateStatusHistoryService} from "../services/statusHistory.service.js"
import { StatusCodes } from "http-status-codes";


export const createStatusHistory = AsyncHandler(async (req,res) => {
    const data = req.body;
    const result = await CreateStatusHistoryService(data);
    res.status(StatusCodes.CREATED).json({
        data:result,
        message:"Template Status Initiated"
    })
})