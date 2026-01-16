import { ReleseGroupModel } from "../models/ReleseGroup.modal"





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
    // const result = await 
};





