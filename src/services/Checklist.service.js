import { CheckListModal } from "../models/checkList.modal.js"


export const createChecklistService = async (data) => {
    const result = await CheckListModal.create(data);
    return result;
};

export const updateChecklistService = async (id,data) => {
    const result = await CheckListModal.findByIdAndUpdate(id,data,{new:true});
    return result;
};

export const DeleteCheckListService = async (id) => {
    const result = await CheckListModal.findByIdAndDelete(id);
    return result;
};

export const getCheckListDataService = async (skip,limit) => {
    const result = await CheckListModal.find({}).sort({_id:-1}).skip(skip).limit(limit).lean();
    return result;
};

export const SearchCheckListDataService = async (search,process,skip,limit) => {
    const result = await CheckListModal.find(process ? {process,item:{$regex:search,$options:"i"}} : {item:{$regex:search,$options:"i"}}).sort({_id:-1}).skip(skip).limit(limit)
}