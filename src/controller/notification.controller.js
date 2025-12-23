import { StatusCodes } from "http-status-codes";
import { GetNotification } from "../services/notification.service.js";
import { AsyncHandler } from "../utils/asyncHandler.js";


export const getNotificationData = AsyncHandler(async (req,res) => {
    let {page,limit} = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const skip = (page -1 )*limit;
    const result = await GetNotification(skip,limit);
    res.status(StatusCodes.OK).json({
        data:result
    });
});