import { StatusCodes } from "http-status-codes";

// ------------------------ local imports ---------------------------------
import { createChecklistService, FindChecklistByName } from "../services/Checklist.service.js";
import { AsyncHandler } from "../utils/asyncHandler.js";
import { BadRequestError } from "../utils/errorHandler.js";


export const CreateChecklistData = AsyncHandler(async (req,res) =>{
    const data = req.body;
    const exist = await FindChecklistByName(data?.item);

    if(exist){
        throw new BadRequestError("Item already exist","CreateChecklistData() method error");
    }

    const result = await createChecklistService(data);
    res.status(StatusCodes.CREATED).json({
        message:"Item Created Successfully",
        data:result
    });
});