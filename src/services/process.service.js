import { ProcessModel } from "../models/process.modal.js"


export const createProcessService = async (data) => {
    const result = await ProcessModel.create(data);
    return result;
};

export const updateProcessService = async (id, data) => {
    const result = await ProcessModel.findByIdAndUpdate(id, data, { new: true });
    return result;
};

export const deleteProcessService = async (id) => {
    const result = await ProcessModel.findByIdAndDelete(id);
    return result;
};

export const getProcessServiceList = async (skip, limit) => {
    const result = await ProcessModel.find({}).sort({ _id: -1 }).skip(skip).limit(limit).lean();
    return result;
};

export const searchProcessServiceList = async (search, skip, limit) => {
    const result = await ProcessModel.find({ $or: [{ process_name: { $regex: search, $options: 'i' } }, { process_no: { $regex: search, $options: 'i' } }] }).sort({ _id: -1 }).skip(skip).limit(limit).lean();
    return result;
};

export const findProcessbyProcesNameOrNumber = async (name, number) => {
    const result = await ProcessModel.findOne({ $or: [{ process_name: name, process_no: number }, { process_no: number, process_name: name }] }).lean();
    return result;
};

export const allProcessService = async () => {
    const result = await ProcessModel.find({}).sort({_id:-1}).select("process_name process_no");
    return result;

}
