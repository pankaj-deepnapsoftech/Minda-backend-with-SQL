import { col, fn, literal, Op, QueryTypes } from "sequelize";
import { sequelize } from "../sequelize.js";
import { AssemblyModal } from "../models/AssemblyLine.modal.js";
import { CheckListHistoryModal } from "../models/checkListHistory.modal.js";
import { CompanyModel } from "../models/company.modal.js";
import { PartModal } from "../models/Part.modal.js";
import { PlantModel } from "../models/plant.modal.js";
import { ProcessModel } from "../models/process.modal.js";
import { UserModel } from "../models/user.modal.js";


export const allCardsData = async (company, plant, date) => {

    const now = date ? new Date(date) : new Date();

    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // 🔹 Assembly base filter
    const assemblyWhere = {
        ...(company && { company_id: company }),
        ...(plant && { plant_id: plant }),
    };

    // 🔹 User filter
    const userWhere = {
        is_admin: false,
        ...(company && { employee_company: company }),
        ...(plant && { employee_plant: plant }),
    };

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
        parts_last_month,
    ] = await Promise.all([

        // 🔹 TOTAL
        AssemblyModal.count({ where: assemblyWhere }),
        UserModel.count({ where: userWhere }),

        ProcessModel.count({
            distinct: true,
            col: "_id",
            include: [{
                model: AssemblyModal,
                as: "assemblies",
                where: assemblyWhere,
                required: true,
            }],
        }),

        PartModal.count({
            distinct: true,
            col: "_id",
            include: [{
                model: AssemblyModal,
                as: "assemblies",
                where: assemblyWhere,
                required: true,
            }],
        }),

        // 🔹 CURRENT MONTH
        AssemblyModal.count({
            where: {
                ...assemblyWhere,
                createdAt: { [Op.gte]: startOfCurrentMonth },
            },
        }),
        UserModel.count({
            where: {
                ...userWhere,
                createdAt: { [Op.gte]: startOfCurrentMonth },
            },
        }),

        ProcessModel.count({
            distinct: true,
            col: "_id",
            include: [{
                model: AssemblyModal,
                as: "assemblies",
                where: {
                    ...assemblyWhere,
                    createdAt: { [Op.gte]: startOfCurrentMonth },
                },
                required: true,
            }],
        }),

        PartModal.count({
            distinct: true,
            col: "_id",
            include: [{
                model: AssemblyModal,
                as: "assemblies",
                where: {
                    ...assemblyWhere,
                    createdAt: { [Op.gte]: startOfCurrentMonth },
                },
                required: true,
            }],
        }),

        // 🔹 LAST MONTH
        AssemblyModal.count({
            where: {
                ...assemblyWhere,
                createdAt: {
                    [Op.gte]: startOfLastMonth,
                    [Op.lt]: startOfCurrentMonth,
                },
            },
        }),
        UserModel.count({
            where: {
                ...userWhere,
                createdAt: {
                    [Op.gte]: startOfLastMonth,
                    [Op.lt]: startOfCurrentMonth,
                },
            },
        }),

        ProcessModel.count({
            distinct: true,
            col: "_id",
            include: [{
                model: AssemblyModal,
                as: "assemblies",
                where: {
                    ...assemblyWhere,
                    createdAt: {
                        [Op.gte]: startOfLastMonth,
                        [Op.lt]: startOfCurrentMonth,
                    },
                },
                required: true,
            }],
        }),

        PartModal.count({
            distinct: true,
            col: "_id",
            include: [{
                model: AssemblyModal,
                as: "assemblies",
                where: {
                    ...assemblyWhere,
                    createdAt: {
                        [Op.gte]: startOfLastMonth,
                        [Op.lt]: startOfCurrentMonth,
                    },
                },
                required: true,
            }],
        }),
    ]);

    return {
        totals: {
            assembly: assembly_total,
            employee: employee_total,
            process: process_total,
            parts: parts_total,
        },
        month_difference: {
            assembly: assembly_current_month - assembly_last_month,
            employee: employee_current_month - employee_last_month,
            process: process_current_month - process_last_month,
            parts: parts_current_month - parts_last_month,
        },
    };
};


export const GetMonthlyTrend = async (admin, user) => {
    const assemblies = await AssemblyModal.findAll({
        where: admin ? {} : { responsibility: user },
        attributes: ["_id"],
    });
    const assemblyIds = assemblies.map((a) => a._id);
    const totalAssemblies = assemblyIds.length;

    if (totalAssemblies === 0) return [];

    const monthly = await CheckListHistoryModal.findAll({
        where: { assembly: { [Op.in]: assemblyIds } },
        attributes: [
            [fn("YEAR", col("createdAt")), "year"],
            [fn("MONTH", col("createdAt")), "month"],
            [fn("COUNT", fn("DISTINCT", col("assembly"))), "checked_count"],
            [literal("COUNT(DISTINCT CASE WHEN is_error = 1 THEN assembly ELSE NULL END)"), "error_count"],
        ],
        group: ["year", "month"],
        order: [
            [fn("YEAR", col("createdAt")), "ASC"],
            [fn("MONTH", col("createdAt")), "ASC"],
        ],
        raw: true,
    });

    return monthly.map((m) => {
        const checked_count = Number(m.checked_count) || 0;
        const error_count = Number(m.error_count) || 0;
        return {
            year: Number(m.year),
            month: Number(m.month),
            checked_count,
            unchecked_count: Math.max(totalAssemblies - checked_count, 0),
            error_count,
            level: "assembly",
        };
    });
};

export const GetDailyAssemblyStatus = async (admin, user, date = new Date()) => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const assemblies = await AssemblyModal.findAll({
        where: admin ? {} : { responsibility: user },
        include: [
            { model: CompanyModel, as: "company", attributes: ["_id", "company_name", "company_address"] },
            { model: PlantModel, as: "plant", attributes: ["_id", "plant_name", "plant_address"] },
            { model: PartModal, as: "part", attributes: ["_id", "part_name", "part_number"] },
            { model: UserModel, as: "responsibleUser", attributes: ["_id", "full_name", "email", "user_id"] },
            { model: ProcessModel, as: "process_id", attributes: ["_id"], through: { attributes: [] } },
        ],
        order: [["assembly_name", "ASC"]],
    });

    const assemblyJson = assemblies.map((a) => a.toJSON());
    const assemblyIds = assemblyJson.map((a) => a._id);

    const histories = assemblyIds.length
        ? await CheckListHistoryModal.findAll({
            where: {
                assembly: { [Op.in]: assemblyIds },
                createdAt: { [Op.between]: [startOfDay, endOfDay] },
            },
            attributes: ["assembly", "is_error"],
        })
        : [];

    const historyByAssembly = new Map();
    for (const h of histories) {
        const list = historyByAssembly.get(h.assembly) || [];
        list.push(h);
        historyByAssembly.set(h.assembly, list);
    }

    return assemblyJson.map((a) => {
        const checks = historyByAssembly.get(a._id) || [];
        const checked = checks.length > 0;
        const error = checks.some((c) => c.is_error === true);
        return {
            ...a,
            checked,
            unchecked: !checked,
            error,
        };
    });
};

export const GetMonthlyPerformance = async (admin, user) => {
    const assemblies = await AssemblyModal.findAll({
        where: admin ? {} : { responsibility: user },
        attributes: ["_id"],
    });
    const assemblyIds = assemblies.map((a) => a._id);
    if (assemblyIds.length === 0) return [];

    const perAssemblyMonth = await sequelize.query(
        `
        SELECT
            YEAR(createdAt) AS year,
            MONTH(createdAt) AS month,
            assembly AS assembly,
            MAX(CASE WHEN is_error = 1 THEN 1 ELSE 0 END) AS has_error
        FROM checklisthistories
        WHERE assembly IN (:assemblyIds)
        GROUP BY YEAR(createdAt), MONTH(createdAt), assembly
        ORDER BY YEAR(createdAt), MONTH(createdAt)
        `,
        { 
            replacements: { assemblyIds }, 
            type: QueryTypes.SELECT 
        }
    );

    const monthMap = new Map();
    for (const row of perAssemblyMonth) {
        const key = `${row.year}-${row.month}`;
        const current = monthMap.get(key) || { year: Number(row.year), month: Number(row.month), running_count: 0, fault_count: 0, level: "assembly" };
        if (Number(row.has_error) === 1) current.fault_count += 1;
        else current.running_count += 1;
        monthMap.set(key, current);
    }

    return [...monthMap.values()].sort((a, b) => (a.year - b.year) || (a.month - b.month));
};

export const GetDailyErrorsAssembly = async (admin, user, date = new Date()) => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const assemblies = await AssemblyModal.findAll({
        where: admin ? {} : { responsibility: user },
        attributes: ["_id"],
    });
    const assemblyIds = assemblies.map((a) => a._id);

    const histories = assemblyIds.length
        ? await CheckListHistoryModal.findAll({
            where: {
                assembly: { [Op.in]: assemblyIds },
                createdAt: { [Op.between]: [startOfDay, endOfDay] },
            },
            attributes: ["assembly", "process_id", "is_error", "is_resolved"],
        })
        : [];

    const assemblyMap = new Map();
    const processErrorCounts = new Map();

    for (const h of histories) {
        const a = assemblyMap.get(h.assembly) || { has_error: false, has_unresolved_error: false };
        if (h.is_error === true) {
            a.has_error = true;
            const count = processErrorCounts.get(h.process_id) || 0;
            processErrorCounts.set(h.process_id, count + 1);
            if (h.is_resolved === false) a.has_unresolved_error = true;
        }
        assemblyMap.set(h.assembly, a);
    }

    let error_assemblies = 0;
    let still_error_assemblies = 0;
    let resolved_assemblies = 0;

    for (const a of assemblyIds) {
        const flags = assemblyMap.get(a);
        if (!flags?.has_error) continue;
        error_assemblies += 1;
        if (flags.has_unresolved_error) still_error_assemblies += 1;
        else resolved_assemblies += 1;
    }

    const topProcessIds = [...processErrorCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([pid]) => pid);

    const processes = topProcessIds.length
        ? await ProcessModel.findAll({
            where: { _id: { [Op.in]: topProcessIds } },
            attributes: ["_id", "process_name"],
        })
        : [];

    const nameById = new Map(processes.map((p) => [p._id, p.process_name]));

    const top_error_processes = topProcessIds.map((pid) => ({
        process_id: pid,
        process_name: nameById.get(pid) || null,
        error_count: processErrorCounts.get(pid) || 0,
    }));

    return {
        assembly_summary: {
            error_assemblies,
            still_error_assemblies,
            resolved_assemblies,
        },
        top_error_processes,
    };
};



















