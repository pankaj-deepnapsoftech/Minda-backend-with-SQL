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








