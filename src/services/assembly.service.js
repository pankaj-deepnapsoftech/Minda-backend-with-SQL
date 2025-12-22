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

export const getAllAssemblyService = async (IsAdmin, userId, skip, limit) => {
    const result = await AssemblyModal.find(IsAdmin ? {} : { responsibility: userId }).sort({ _id: -1 }).skip(skip).limit(limit).populate([
        { path: "company_id", select: "company_name company_address" },
        { path: "plant_id", select: "plant_name plant_address" },
        { path: "responsibility", select: "email full_name email user_id desigination" },
        { path: "process_id", select: "process_name process_no" },
        { path: "part_id", select: "part_number part_name" }
    ]).lean();
    return result;
};

export const searchAllAssemblyService = async (
    IsAdmin,
    userId,
    search = "",
    part_id,
    process_id,
    responsibility,
    plant_id,
    company_id,
    skip = 0,
    limit = 10
) => {

    const filterData = {
        $or: [
            { assembly_name: { $regex: search, $options: "i" } },
            { assembly_number: { $regex: search, $options: "i" } }
        ]
    };

    if (company_id) {
        filterData.company_id = company_id;
    }

    if (plant_id) {
        filterData.plant_id = plant_id;
    }

    if (responsibility) {
        filterData.responsibility = responsibility;
    }

    if (process_id) {
        filterData.process_id = process_id;
    }

    if (part_id) {
        filterData.part_id = part_id;
    }

    const result = await AssemblyModal
        .find(IsAdmin ? { ...filterData } : { ...filterData, responsibility: userId })
        .sort({ _id: -1 })
        .skip(Number(skip))
        .limit(Number(limit))
        .populate([
            {
                path: "company_id",
                select: "company_name company_address"
            },
            {
                path: "plant_id",
                select: "plant_name plant_address"
            },
            {
                path: "responsibility",
                select: "full_name email user_id desigination"
            },
            {
                path: "process_id",
                select: "process_name process_no"
            },
            { path: "part_id", select: "part_number part_name" }
        ])
        .lean();

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
            $match: {
                responsibility: new mongoose.Types.ObjectId(responsibility)
            }
        },
        {
            $lookup: {
                from: "processes",
                localField: "process_id",
                foreignField: "_id",
                as: "process_id"
            }
        },
        {
            $project: {
                assembly_name: 1,
                assembly_number: 1,
                process_id: 1
            }
        }
    ]);
    return result;
};

export const getAssemblyLineFormByResponsibility = async (user, id) => {

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
                pipeline: [
                    {
                        $project: {
                            company_name: 1,
                            company_address: 1
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
                pipeline: [
                    {
                        $project: {
                            plant_name: 1,
                            plant_address: 1
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
                        $lookup: {
                            from: "checklists",
                            localField: "_id",
                            foreignField: "process",
                            as: "checklist_item"
                        }
                    }
                ]
            }
        },


        {
            $addFields: {
                responsibility: { $arrayElemAt: ["$responsibility", 0] },
                company_id: { $arrayElemAt: ["$company_id", 0] },
                plant_id: { $arrayElemAt: ["$plant_id", 0] },
            }
        },

    ])
    return result;
};

export const GetAssemblyLineDataReport = async (admin, user_id) => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const result = await AssemblyModal.aggregate([
        {
            $match: admin ? {} : { responsibility: new mongoose.Types.ObjectId(user_id) }
        },

        /* ================= LOOKUP PROCESSES ================= */
        {
            $lookup: {
                from: "processes",
                localField: "process_id",
                foreignField: "_id",
                as: "process_id",
                let: { assemblyId: "$_id" },
                pipeline: [
                    {
                        $project: {
                            process_name: 1,
                            process_no: 1
                        }
                    },
                    {
                        $lookup: {
                            from: "checklisthistories",
                            let: { processId: "$_id", assemblyId: "$$assemblyId" },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                { $eq: ["$process_id", "$$processId"] },
                                                { $eq: ["$assembly", "$$assemblyId"] }
                                            ]
                                        },
                                        createdAt: { $gte: startOfDay, $lte: endOfDay }
                                    }
                                },
                                {
                                    $project: {
                                        status: 1,
                                        is_error: 1
                                    }
                                }
                            ],
                            as: "today"
                        }
                    },

                    /* ===== PROCESS LEVEL COUNTS ===== */
                    {
                        $addFields: {
                            total_checked: {
                                $size: {
                                    $filter: {
                                        input: "$today",
                                        as: "t",
                                        cond: { $ne: ["$$t.status", "Unchecked"] }
                                    }
                                }
                            },
                            total_unchecked: {
                                $size: {
                                    $filter: {
                                        input: "$today",
                                        as: "t",
                                        cond: { $eq: ["$$t.status", "Unchecked"] }
                                    }
                                }
                            },
                            total_resolved: {
                                $size: {
                                    $filter: {
                                        input: "$today",
                                        as: "t",
                                        cond: { $eq: ["$$t.status", "Resolved"] }
                                    }
                                }
                            },
                            total_errors: {
                                $size: {
                                    $filter: {
                                        input: "$today",
                                        as: "t",
                                        cond: { $eq: ["$$t.is_error", true] }
                                    }
                                }
                            }
                        }
                    }
                ]
            }
        },

        /* ================= ASSEMBLY LEVEL COUNTS ================= */
        {
            $addFields: {
                assembly_checked: {
                    $sum: "$process_id.total_checked"
                },
                assembly_unchecked: {
                    $sum: "$process_id.total_unchecked"
                },
                assembly_errors: {
                    $sum: "$process_id.total_errors"
                },
                total_resolved: {
                    $sum: "$process_id.total_resolved"
                }
            }
        },

        /* ================= FINAL SUMMARY ================= */
        {
            $facet: {
                data: [{ $sort: { createdAt: -1 } }],
                summary: [
                    {
                        $group: {
                            _id: null,
                            total_assemblies: { $sum: 1 },
                            total_checked: { $sum: "$assembly_checked" },
                            total_unchecked: { $sum: "$assembly_unchecked" },
                            total_errors: { $sum: "$assembly_errors" },
                            total_resolved: { $sum: "$total_resolved" }
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                summary: { $arrayElemAt: ["$summary", 0] }
            }
        }
    ]);

    return result[0].summary;
};


export const getAssemblyLineTodayReport = async (
  admin,
  user_id,
  skip,
  limit,
  startdate,
  endDate
) => {

    // ✅ If dates not provided, use today's date
    const today = new Date();

    const startOfDay = startdate ? new Date(startdate) : new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = endDate ? new Date(endDate) : new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const result = await AssemblyModal.aggregate([
        {
            $match: admin ? {} : { responsibility: new mongoose.Types.ObjectId(user_id) }
        },
        { $skip: skip },
        { $limit: limit },

        // ---------- Company ----------
        {
            $lookup: {
                from: "companies",
                localField: "company_id",
                foreignField: "_id",
                as: "company_id",
                pipeline: [
                    {
                        $project: {
                            company_address: 1,
                            company_name: 1,
                            description: 1,
                        }
                    }
                ]
            }
        },

        // ---------- Plant ----------
        {
            $lookup: {
                from: "plants",
                localField: "plant_id",
                foreignField: "_id",
                as: "plant_id",
                pipeline: [
                    {
                        $project: {
                            plant_name: 1,
                            plant_address: 1,
                            description: 1
                        }
                    }
                ]
            }
        },

        // ---------- User ----------
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
                            user_id: 1,
                            desigination: 1
                        }
                    }
                ]
            }
        },

        {
            $addFields: {
                responsibility: { $arrayElemAt: ["$responsibility", 0] },
                company_id: { $arrayElemAt: ["$company_id", 0] },
                plant_id: { $arrayElemAt: ["$plant_id", 0] },
            }
        },

        // ---------- Process + Today Checklist ----------
        {
            $lookup: {
                from: "processes",
                localField: "process_id",
                foreignField: "_id",
                as: "process_id",
                let: { assemblyId: "$_id" },
                pipeline: [
                    {
                        $project: {
                            process_name: 1,
                            process_no: 1
                        }
                    },
                    {
                        $lookup: {
                            from: "checklisthistories",
                            let: {
                                processId: "$_id",
                                assemblyId: "$$assemblyId"
                            },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                { $eq: ["$process_id", "$$processId"] },
                                                { $eq: ["$assembly", "$$assemblyId"] }
                                            ]
                                        },
                                        createdAt: {
                                            $gte: startOfDay,
                                            $lte: endOfDay
                                        }
                                    }
                                },
                                {
                                    $lookup: {
                                        from: "checklists",
                                        localField: "checkList",
                                        foreignField: "_id",
                                        as: "checkList"
                                    }
                                },
                                {
                                    $project: {
                                        checkList: 1,
                                        result: 1,
                                        is_error: 1,
                                        description: 1,
                                        status:1
                                    }
                                }
                            ],
                            as: "check_items"
                        }
                    }
                ]
            }
        }
    ]);

    return result[0];
};





