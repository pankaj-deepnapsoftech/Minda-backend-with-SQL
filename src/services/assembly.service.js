import mongoose from "mongoose";
import { AssemblyModal } from "../models/AssemblyLine.modal.js"



export const createAssemblyService = async (data) => {
    const result = await AssemblyModal.create(data);
    return result;
};

export const updateAssemblyService = async (id, data) => {
    const result = await AssemblyModal.findByIdAndUpdate(id, data);
    return result;
};


export const deleteAssemblyService = async (id) => {
    const result = await AssemblyModal.findByIdAndDelete(id);
    return result;
};

export const getAllAssemblyService = async (skip, limit) => {
    const result = await AssemblyModal.find({}).sort({ _id: -1 }).skip(skip).limit(limit).populate([{ path: "company_id", select: "company_name company_address" }, { path: "plant_id", select: "plant_name plant_address" }, { path: "responsibility", select: "email full_name email user_id desigination" }, { path: "process_id", select: "process_name process_no" }]).lean();
    return result;
};


export const searchAllAssemblyService = async (search="", skip, limit) => {
    const result = await AssemblyModal.find({ $or: [{ assembly_name: { $regex: search, $options: "i" } }, { assembly_number: { $regex: search, $options: "i" } }] }).sort({ _id: -1 }).skip(skip).limit(limit).populate([{ path: "company_id", select: "company_name company_address" }, { path: "plant_id", select: "plant_name plant_address" }, { path: "responsibility", select: "email full_name email user_id desigination" }, { path: "process_id", select: "process_name process_no" }]).lean();
    return result;
};

export const findAssemblyByName = async (name, number) => {
    const result = await AssemblyModal.findOne({ assembly_name: name, assembly_number: number });
    return result;
};

export const getAllAssemblyDataService = async () => {
    const result = await AssemblyModal.find({}).sort({ _id: -1 }).select("assembly_number assembly_name").lean();
    return result;
};

export const getAssemblyLineByResponsibility = async (responsibility) => {
    const result = await AssemblyModal.aggregate([
        {
            $match:{
                responsibility:new mongoose.Types.ObjectId(responsibility)
            }
        },
        {
            $lookup:{
                from:"processes",
                localField:"process_id",
                foreignField:"_id",
                as:"process_id"
            }
        },
        {
            $project:{
                assembly_name:1,
                assembly_number:1,
                process_id:1
            }
        }
    ]);
    return result;
};


export const getAssemblyLineFormByResponsibility = async (user, id, process) => {

    const result = await AssemblyModal.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(id),
                responsibility: new mongoose.Types.ObjectId(user)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "responsibility",
                foreignField: "_id",
                as: "responsibility",
                pipeline: [
                    {
                        $project: {
                            full_name: 1,
                            email: 1,
                            user_id: 1
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "companies",
                foreignField: "_id",
                localField: "company_id",
                as: "company_id",
                pipeline:[
                    {
                        $project:{
                            company_name:1,
                            company_address:1
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "plants",
                foreignField: "_id",
                localField: "plant_id",
                as: "plant_id",
                pipeline:[
                    {
                        $project:{
                            plant_name:1,
                            plant_address:1
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "processes",
                localField: "process_id",
                foreignField: "_id",
                as: "process_id",
                pipeline: [
                    {
                        $match: {
                            _id: new mongoose.Types.ObjectId(process)
                        }
                    }
                ]
            }
        },


        {
            $addFields: {
                process_id: { $arrayElemAt: ["$process_id", 0] },
                responsibility: { $arrayElemAt: ["$responsibility", 0] },
                company_id: { $arrayElemAt: ["$company_id", 0] },
                plant_id: { $arrayElemAt: ["$plant_id", 0] },
            }
        },
        {
            $lookup: {
                from: "checklists",
                localField: "process_id._id",
                foreignField: "process",
                as: "checklist_item"
            }
        }
    ])
    return result;
}






