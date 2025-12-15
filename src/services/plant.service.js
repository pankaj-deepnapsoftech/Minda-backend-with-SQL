import { PlantModel } from "../models/plant.modal.js";


export const plantCreateService = async (data) => {
    const result = await PlantModel.create(data);
    return result;
};

export const plantlistService = async (skip,limit) => {
    const result = await PlantModel.find().skip(skip).limit(limit).populate("company_id").lean();
    return result;
};

export const plantUpdateService = async (is,data) => {
    const result = await PlantModel.findByIdAndUpdate(is,data,{new:true});
    return result;
};

export const plantDeleteService = async (id) => {
    const result = await PlantModel.findByIdAndDelete(id);
    return result;
};

export const getPlantByIdService = async (id) => {
    const result = await PlantModel.findById(id);
    return result;
};

export const plantSearchService = async (query,skip,limit) => {
    const result = await PlantModel.find({$or:[{plant_name:{$regex:query,$options:"i"}},{plant_address:{$regex:query,$options:"i"}}]}).skip(skip).limit(limit).populate("company_id").lean();
    return result;
};

export const AllPlantDataService = async (companyId) => {
    const result = await PlantModel.find({company_id:companyId}).select("plant_name");
    return result;
};











