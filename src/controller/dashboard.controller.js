import { StatusCodes } from "http-status-codes";
import { allCardsData } from "../services/dashboard.service.js";
import { AsyncHandler } from "../utils/asyncHandler.js";


export const GetAllCardsData = AsyncHandler(async (req,res) => {
    const result = await allCardsData();
    res.status(StatusCodes.OK).json({
        data:result
    });
});