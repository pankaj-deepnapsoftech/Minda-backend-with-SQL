import { StatusCodes } from "http-status-codes";
import { allCardsData, GetDailyAssemblyStatus, GetDailyErrorsAssembly, GetMonthlyPerformance, GetMonthlyTrend } from "../services/dashboard.service.js";
import { AsyncHandler } from "../utils/asyncHandler.js";


export const GetAllCardsData = AsyncHandler(async (req, res) => {
    const {company,plant,start_date,end_date} = req.query;
    const result = await allCardsData(company,plant,start_date,end_date);
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



export const getAllActiveAssembyMonthly = AsyncHandler(async (req,res) => {
    const user = req.currentUser;
    const { start_date, end_date } = req.query;
    const result = await GetMonthlyPerformance(user?.is_admin, user?._id, start_date, end_date);
    res.status(StatusCodes.OK).json({
        data: result
    });
});


export const getAllAssemblyErrorHistory = AsyncHandler(async (req,res) => {
    const user = req.currentUser;
    const { start_date, end_date,company,plant } = req.query;
    const result = await GetDailyErrorsAssembly(user?.is_admin, user?._id, start_date, end_date,company,plant);
    res.status(StatusCodes.OK).json({
        data: result
    });
});












