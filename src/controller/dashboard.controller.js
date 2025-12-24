import { StatusCodes } from "http-status-codes";
import { allCardsData,  GetDailyAssemblyStatus, GetMonthlyTrend } from "../services/dashboard.service.js";
import { AsyncHandler } from "../utils/asyncHandler.js";


export const GetAllCardsData = AsyncHandler(async (req, res) => {
    const result = await allCardsData();
    res.status(StatusCodes.OK).json({
        data: result
    });
});


export const GetMonthlyTrendData = AsyncHandler(async (req, res) => {
    const user = req.currentUser;

    const result = await GetMonthlyTrend(user?.is_admin, user?._id);
    res.status(StatusCodes.OK).json({
        data: result
    });
});

export const getAssemblyData = AsyncHandler(async (req, res) => {
    const user = req.currentUser;
    const result = await GetDailyAssemblyStatus(user?.is_admin, user?._id);
    res.status(StatusCodes.OK).json({
        data: result
    });
});








