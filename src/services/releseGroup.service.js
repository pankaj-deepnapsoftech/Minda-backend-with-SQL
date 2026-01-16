import { ReleseGroupModel } from "../models/ReleseGroup.modal.js"
import { BadRequestError } from "../utils/errorHandler.js";





export const createReleseGroup = async (data) => {
    const result = await ReleseGroupModel.create(data);
    return result;
};


export const getRelesGroup = async (skip,limit) => {
    const result = await ReleseGroupModel.findAll({
        offset:skip,
        limit
    });

    return result;
};

export const updateRelesGroup = async (id,data) => {
    const result = await ReleseGroupModel.findByPk(id);
    if(!result){
        throw new BadRequestError("Data Not Found");
    };
    await result.update(data);
    return result;
};

export const DeleteRelesGroup = async (id) => {
    const result = await ReleseGroupModel.destroy({
        where:{_id:id}
    });

    return result;
};




