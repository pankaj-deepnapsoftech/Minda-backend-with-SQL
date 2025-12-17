import { PartModal } from "../models/Part.modal.js"


export const createPartsService = async (data) => {
    const result = await PartModal.create(data);
    return result;
};

export const UpdatePartService = async (id,data) => {
    const result = await PartModal.findByIdAndUpdate(id,data,{new:true});
    return result;
};

export const DeletePartService = async (id) => {
    const result = await PartModal.findByIdAndDelete(id);
    return result;
};

export const GetAllPartsService = async() => {
    const result = await PartModal.find({}).sort({_id:-1}).select("part_number part_name").lean();
    return result;
};

export const FindPartServiceByName =  async (data) => {
    const result = await PartModal.findOne(data).lean();
    return result;
}




