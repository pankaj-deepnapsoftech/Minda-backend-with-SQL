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


export const GetMonthlyTrend = async () => {
    const result = await AssemblyModal.aggregate([
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










