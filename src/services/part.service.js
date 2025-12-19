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

export const getPartsServiceData = async (search="",skip,limit) => {
    const result = await PartModal.aggregate([
        {
            $match:{
                $or:[
                    {part_name: { $regex: search, $options: "i" }},
                    {part_number: { $regex: search, $options: "i" }}
                ]
            }
        },
        {
            $lookup:{
                from:"assemblies",
                localField:"_id",
                foreignField:"part_id",
                as:"assemblies",
                pipeline:[
                    {
                        $project:{
                            assembly_name:1,
                            assembly_number:1,
                        }
                    }
                ]
            }
        },
        {
      $addFields: {
        total_assemblies: { $size: "$assemblies" }
      }
    }
    ]).sort({_id:-1}).skip(skip).limit(limit);
    return result
}



