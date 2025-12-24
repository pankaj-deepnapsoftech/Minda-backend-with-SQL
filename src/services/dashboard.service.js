import mongoose from "mongoose";
import { AssemblyModal } from "../models/AssemblyLine.modal.js"
import { PartModal } from "../models/Part.modal.js";
import { ProcessModel } from "../models/process.modal.js";
import { UserModel } from "../models/user.modal.js";



export const allCardsData = async () => {
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
        assembly_total,
        employee_total,
        process_total,
        parts_total,

        assembly_current_month,
        employee_current_month,
        process_current_month,
        parts_current_month,

        assembly_last_month,
        employee_last_month,
        process_last_month,
        parts_last_month
    ] = await Promise.all([
        // Total counts
        AssemblyModal.countDocuments(),
        UserModel.countDocuments({ is_admin: false }),
        ProcessModel.countDocuments(),
        PartModal.countDocuments(),

        // Current month counts
        AssemblyModal.countDocuments({ createdAt: { $gte: startOfCurrentMonth } }),
        UserModel.countDocuments({ is_admin: false, createdAt: { $gte: startOfCurrentMonth } }),
        ProcessModel.countDocuments({ createdAt: { $gte: startOfCurrentMonth } }),
        PartModal.countDocuments({ createdAt: { $gte: startOfCurrentMonth } }),

        // Last month counts
        AssemblyModal.countDocuments({
            createdAt: { $gte: startOfLastMonth, $lt: startOfCurrentMonth }
        }),
        UserModel.countDocuments({
            is_admin: false,
            createdAt: { $gte: startOfLastMonth, $lt: startOfCurrentMonth }
        }),
        ProcessModel.countDocuments({
            createdAt: { $gte: startOfLastMonth, $lt: startOfCurrentMonth }
        }),
        PartModal.countDocuments({
            createdAt: { $gte: startOfLastMonth, $lt: startOfCurrentMonth }
        })
    ]);

    return {
        totals: {
            assembly: assembly_total,
            employee: employee_total,
            process: process_total,
            parts: parts_total
        },
        month_difference: {
            assembly: assembly_current_month - assembly_last_month,
            employee: employee_current_month - employee_last_month,
            process: process_current_month - process_last_month,
            parts: parts_current_month - parts_last_month
        }
    };
};


export const GetMonthlyTrend = async (admin,user) => {
    const result = await AssemblyModal.aggregate([
        {
            $match: admin ? {} : {responsibility:new mongoose.Types.ObjectId(user)}
        },
        // 1️⃣ Lookup checklist histories
        {
            $lookup: {
                from: "checklisthistories",
                let: { assemblyId: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ["$assembly", "$$assemblyId"] }
                        }
                    },
                    {
                        $addFields: {
                            day: {
                                $dateToString: {
                                    format: "%Y-%m-%d",
                                    date: "$createdAt"
                                }
                            },
                            year: { $year: "$createdAt" },
                            month: { $month: "$createdAt" }
                        }
                    }
                ],
                as: "checks"
            }
        },

        // 2️⃣ Group per assembly per day
        {
            $unwind: {
                path: "$checks",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $group: {
                _id: {
                    assembly: "$_id",
                    day: "$checks.day",
                    year: "$checks.year",
                    month: "$checks.month"
                },
                total_checks: { $sum: { $cond: ["$checks", 1, 0] } },
                error_found: {
                    $max: {
                        $cond: ["$checks.is_error", 1, 0]
                    }
                }
            }
        },

        // 3️⃣ Determine day-level status
        {
            $project: {
                year: "$_id.year",
                month: "$_id.month",
                checked: {
                    $cond: [{ $gt: ["$total_checks", 0] }, 1, 0]
                },
                unchecked: {
                    $cond: [{ $eq: ["$total_checks", 0] }, 1, 0]
                },
                error: "$error_found"
            }
        },

        // 4️⃣ Roll up to MONTH level
        {
            $group: {
                _id: {
                    year: "$year",
                    month: "$month"
                },
                checked_count: { $sum: "$checked" },
                unchecked_count: { $sum: "$unchecked" },
                error_count: { $sum: "$error" }
            }
        },

        // 5️⃣ Sort + clean output
        {
            $sort: {
                "_id.year": 1,
                "_id.month": 1
            }
        },
        {
            $project: {
                _id: 0,
                year: "$_id.year",
                month: "$_id.month",
                checked_count: 1,
                unchecked_count: 1,
                error_count: 1,
                level: { $literal: "assembly" }
            }
        }
    ]);

    return result;
};


export const GetDailyAssemblyStatus = async (admin,user,date = new Date()) => {

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const result = await AssemblyModal.aggregate([
        {
            $match: admin ? {} : {responsibility:new mongoose.Types.ObjectId(user)}
        },
        {
            $lookup:{
                from:"companies",
                localField:"company_id",
                foreignField:"_id",
                as:"company_id",
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
            $lookup:{
                from:"plants",
                localField:"plant_id",
                foreignField:"_id",
                as:"plant_id",
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
            $lookup:{
                from:"parts",
                localField:"part_id",
                foreignField:"_id",
                as:"part_id",
                pipeline:[
                    {
                        $project:{
                            part_name:1,
                            part_number:1
                        }
                    }
                ]
            }
        },

        {
            $lookup:{
                from:"users",
                localField:"responsibility",
                foreignField:"_id",
                as:"responsibility",
                pipeline:[
                    {
                        $project:{
                            full_name:1,
                            email:1,
                            user_id:1
                        }
                    }
                ]
            }
        },

        {
            $addFields:{
                company_id:{$arrayElemAt:["$company_id",0]},
                plant_id:{$arrayElemAt:["$plant_id",0]},
                part_id:{$arrayElemAt:["$part_id",0]},
                responsibility:{$arrayElemAt:["$responsibility",0]},
            }
        },

        // 1️⃣ Lookup checklist histories ONLY for the given day
        {
            $lookup: {
                from: "checklisthistories",
                let: { assemblyId: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$assembly", "$$assemblyId"] },
                                    { $gte: ["$createdAt", startOfDay] },
                                    { $lte: ["$createdAt", endOfDay] }
                                ]
                            }
                        }
                    }
                ],
                as: "checks"
            }
        },

        // 2️⃣ Convert checklist presence to BOOLEAN status
        {
            $addFields: {
                checked: {
                    $gt: [{ $size: "$checks" }, 0]
                },
                unchecked: {
                    $eq: [{ $size: "$checks" }, 0]
                },
                error: {
                    $gt: [
                        {
                            $size: {
                                $filter: {
                                    input: "$checks",
                                    as: "c",
                                    cond: { $eq: ["$$c.is_error", true] }
                                }
                            }
                        },
                        0
                    ]
                }
            }
        },

        // 3️⃣ Final response (FULL assembly data)
        {
            $project: {
                checks: 0   // hide raw checklist array
            }
        },

        // 4️⃣ Optional sorting
        {
            $sort: { assembly_name: 1 }
        }
    ]);

    return result;
};


export const GetMonthlyPerformance = async (admin, user) => {

    const result = await AssemblyModal.aggregate([

        // 1️⃣ Assembly filter
        {
            $match: admin ? {} : { responsibility: new mongoose.Types.ObjectId(user) }
        },

        // 2️⃣ Lookup checklist histories
        {
            $lookup: {
                from: "checklisthistories",
                let: { assemblyId: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ["$assembly", "$$assemblyId"] }
                        }
                    },
                    {
                        $addFields: {
                            year: { $year: "$createdAt" },
                            month: { $month: "$createdAt" }
                        }
                    }
                ],
                as: "checks"
            }
        },

        // 3️⃣ Unwind checks
        {
            $unwind: {
                path: "$checks",
                preserveNullAndEmptyArrays: true
            }
        },

        // 4️⃣ Group per ASSEMBLY per MONTH
        {
            $group: {
                _id: {
                    assembly: "$_id",
                    year: "$checks.year",
                    month: "$checks.month"
                },
                has_error: {
                    $max: {
                        $cond: ["$checks.is_error", 1, 0]
                    }
                }
            }
        },

        // 5️⃣ Assembly-level monthly status
        {
            $project: {
                year: "$_id.year",
                month: "$_id.month",
                fault: "$has_error",
                running: {
                    $cond: [{ $eq: ["$has_error", 0] }, 1, 0]
                }
            }
        },

        // 6️⃣ Roll up to MONTH level
        {
            $group: {
                _id: {
                    year: "$year",
                    month: "$month"
                },
                fault_count: { $sum: "$fault" },
                running_count: { $sum: "$running" }
            }
        },

        // 7️⃣ Sort + clean output
        {
            $sort: {
                "_id.year": 1,
                "_id.month": 1
            }
        },
        {
            $project: {
                _id: 0,
                year: "$_id.year",
                month: "$_id.month",
                fault_count: 1,
                running_count: 1,
                level: { $literal: "assembly" }
            }
        }
    ]);

    return result;
};

















