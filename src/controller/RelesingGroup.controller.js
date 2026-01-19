import { StatusCodes } from "http-status-codes";
import { createReleseGroup, getReleaseGroupByNames } from "../services/releaseGroup.service.js";
import { AsyncHandler } from "../utils/asyncHandler.js";
import { CreateGroupUsersService } from "../services/groupUser.service.js";
import { BadRequestError } from "../utils/errorHandler.js";


export const createRelasingGroup = AsyncHandler(async (req, res) => {
    const data = req.body;

    const exist = await getReleaseGroupByNames(data.group_department,data.group_name);
    if(exist){
        throw new BadRequestError("Group already exist","createRelasingGroup() method error")
    }
    const group = await createReleseGroup(data);

    res.status(StatusCodes.CREATED).json({
        message: "Group created successfully",
    });

    if (data?.users && data?.users.length > 0) {
        const newData = data?.users.map((item) => ({ ...item,plants_id:JSON.stringify(item.plants_id), relese_group_id: group._id }));
        await CreateGroupUsersService(newData)
    };
});