import { PlantModel } from "../models/plant.modal.js";


export const plantCreateService = async (data) => {
    const result = await PlantModel.create(data);
    return result;
};

export const plantlistService = async (skip,limit) => {
    const result = await PlantModel.find().skip(skip).limit(limit).populate("company_id");
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
}












