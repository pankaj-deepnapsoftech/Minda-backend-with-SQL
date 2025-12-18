import mongoose from "mongoose";
import { AssemblyModal } from "../models/AssemblyLine.modal.js"



export const createAssemblyService = async (data) => {
    const result = await AssemblyModal.create(data);
    return result;
};

export const updateAssemblyService = async (id,data) => {
    const result = await AssemblyModal.findByIdAndUpdate(id,data);
    return result;
};


export const deleteAssemblyService = async (id) => {
    const result = await AssemblyModal.findByIdAndDelete(id);
    return result;
};

export const getAllAssemblyService = async (skip,limit) => {
    const result = await AssemblyModal.find({}).sort({_id:-1}).skip(skip).limit(limit).populate([{path:"company_id",select:"company_name company_address"},{path:"plant_id",select:"plant_name plant_address"},{path:"responsibility",select:"email full_name email user_id desigination"},{path:"process_id",select:"process_name process_no"}]).lean();
    return result;
};


export const searchAllAssemblyService = async (search,skip,limit) => {
        const result = await AssemblyModal.find({$or:[{assembly_name:{$regex:search,$options:"i"}},{assembly_number:{$regex:search,$options:"i"}}]}).sort({_id:-1}).skip(skip).limit(limit).populate([{path:"company_id",select:"company_name company_address"},{path:"plant_id",select:"plant_name plant_address"},{path:"responsibility",select:"email full_name email user_id desigination"},{path:"process_id",select:"process_name process_no"}]).lean();
        return result;
};

export const findAssemblyByName = async (name,number) => {
    const result = await AssemblyModal.findOne({assembly_name:name,assembly_number:number});
    return result;
};

export const getAllAssemblyDataService = async () => {
    const result = await AssemblyModal.find({}).sort({_id:-1}).select("assembly_number assembly_name").lean();
    return result;
};

export const getAssemblyLineByResponsibility = async (responsibility) => {
    const result = await AssemblyModal.find({responsibility}).sort({_id:-1}).select("assembly_number assembly_name").lean();
    return result;
};


export const getAssemblyLineFormByResponsibility = async (user,id,process) => { 

    const result = await AssemblyModal.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(id),
                responsibility:new mongoose.Types.ObjectId(user)
            }
        },
        {
            $lookup:{
                from:"processes",
                localField:"process_id",
                foreignField:"_id",
                as:"process_id",
                pipeline:[
                    {
                        $match:{
                            _id: new mongoose.Types.ObjectId(process)
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                process_id:{$array}
            }
        }
    ])
    return result;
}






