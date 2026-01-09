import { StatusCodes } from "http-status-codes";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";


// ------------------------ local imports ---------------------------------
import { createChecklistService, DeleteCheckListService, FindCheckListById, FindChecklistByName, getCheckListDataService, SearchCheckListDataService, updateChecklistService } from "../services/Checklist.service.js";
import { AsyncHandler } from "../utils/asyncHandler.js";
import { BadRequestError, NotFoundError } from "../utils/errorHandler.js";
import { config } from "../config.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


export const CreateChecklistData = AsyncHandler(async (req, res) => {
    const data = req.body;
    const file = req.file;

    const file_path = file ? `${config.NODE_ENV !== "development" ? config.SERVER_URL: config.LOCAL_SERVER_URL}/files/${file.filename}` : null;
   
    const exist = await FindChecklistByName(data?.item);

    if (exist) {
        throw new BadRequestError("Item already exist", "CreateChecklistData() method error");
    }

    const result = await createChecklistService({...data,file_path});
    res.status(StatusCodes.CREATED).json({
        message: "Item Created Successfully",
        data: result
    });
});

export const UpdateCheckListData = AsyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = req.body;

    const file = req.file;
    const file_path = file ? `${config.NODE_ENV !== "development" ? config.SERVER_URL: config.LOCAL_SERVER_URL}/files/${file.filename}` : null;

    const exist = await FindCheckListById(id);

    if(!exist){
        throw new NotFoundError("Item not found", "UpdateCheckListData() method error")
    }

    fs.unlinkSync(path.join(__dirname, `../../public/temp/${exist.file_path?.split("/files/")[1]}`));

    const result = await updateChecklistService(id, {data,file_path});
    if (!result) {
        throw new NotFoundError("Item not found", "UpdateCheckListData() method error")
    }

    res.status(StatusCodes.OK).json({
        message: "Check Item Updated Successfully",
        result
    })
});

export const DeleteCheckList = AsyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await DeleteCheckListService(id);
    if (!result) {
        throw new NotFoundError("Item not found", "UpdateCheckListData() method error")
    }

     fs.unlinkSync(path.join(__dirname, `../../public/temp/${result.file_path?.split("/files/")[1]}`));
    res.status(StatusCodes.OK).json({
        message: "Check Item Updated Successfully",
        result
    })
});

export const GetCheckList = AsyncHandler(async (req, res) => {
    let { limit, page } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const skip = (page - 1) * limit;
    const result = await getCheckListDataService(skip, limit);
    res.status(StatusCodes.OK).json({
        data: result
    });
});

export const searchCheckList = AsyncHandler(async (req, res) => {
    let { search, process, limit, page } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const skip = (page - 1) * limit;
    const result = await SearchCheckListDataService(search?.trim(), process?.trim(), skip, limit);
    res.status(StatusCodes.OK).json({
        data: result
    });
});






