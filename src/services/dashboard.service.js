import {  Op, QueryTypes } from "sequelize";
import { sequelize } from "../sequelize.js";
import { AssemblyModal } from "../models/AssemblyLine.modal.js";
import { CheckListHistoryModal } from "../models/checkListHistory.modal.js";
import { CompanyModel } from "../models/company.modal.js";
import { PartModal } from "../models/Part.modal.js";
import { PlantModel } from "../models/plant.modal.js";
import { ProcessModel } from "../models/process.modal.js";
import { UserModel } from "../models/user.modal.js";


export const allCardsData = async (
    company = "",
    plant = "",
    startDate,
    endDate
) => {

    // 🔹 Helpers to normalize full-day ranges
    const normalizeStart = (date) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d;
    };

    const normalizeEnd = (date) => {
        const d = new Date(date);
        d.setHours(23, 59, 59, 999);
        return d;
    };

    const now = new Date();

    // 🔹 CURRENT PERIOD
    const currentStart = startDate
        ? normalizeStart(startDate)
        : new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    const currentEnd = endDate
        ? normalizeEnd(endDate)
        : normalizeEnd(now);

    // 🔹 PREVIOUS PERIOD (same duration, previous month)
    const lastStart = new Date(currentStart);
    lastStart.setMonth(lastStart.getMonth() - 1);

    const lastEnd = new Date(currentEnd);
    lastEnd.setMonth(lastEnd.getMonth() - 1);

    // 🔹 Assembly base filter
    const assemblyWhere = {
        ...(company && { company_id: company }),
        ...(plant && { plant_id: plant }),
    };

    // 🔹 User base filter
    const userWhere = {
        is_admin: false,
        ...(company && { employee_company: company }),
        ...(plant && { employee_plant: plant }),
    };


    const [
        assembly_current,
        employee_current,
        process_current,
        parts_current,

        assembly_last,
        employee_last,
        process_last,
        parts_last,
    ] = await Promise.all([

        // 🔹 CURRENT PERIOD
        AssemblyModal.count({
            where: {
                ...assemblyWhere,
                createdAt: {
                    [Op.gte]: currentStart,
                    [Op.lte]: currentEnd,
                },
            },
        }),

        UserModel.count({
            where: {
                ...userWhere,
                createdAt: {
                    [Op.gte]: currentStart,
                    [Op.lte]: currentEnd,
                },
            },
        }),

        ProcessModel.count({
            distinct: true,
            col: "_id",
            include: [{
                model: AssemblyModal,
                as: "assemblies",
                required: true,
                where: {
                    ...assemblyWhere,
                    createdAt: {
                        [Op.gte]: currentStart,
                        [Op.lte]: currentEnd,
                    },
                },
            }],
        }),

        PartModal.count({
            distinct: true,
            col: "_id",
            include: [{
                model: AssemblyModal,
                as: "assemblies",
                required: true,
                where: {
                    ...assemblyWhere,
                    createdAt: {
                        [Op.gte]: currentStart,
                        [Op.lte]: currentEnd,
                    },
                },
            }],
        }),

        // 🔹 PREVIOUS PERIOD
        AssemblyModal.count({
            where: {
                ...assemblyWhere,
                createdAt: {
                    [Op.gte]: lastStart,
                    [Op.lte]: lastEnd,
                },
            },
        }),

        UserModel.count({
            where: {
                ...userWhere,
                createdAt: {
                    [Op.gte]: lastStart,
                    [Op.lte]: lastEnd,
                },
            },
        }),

        ProcessModel.count({
            distinct: true,
            col: "_id",
            include: [{
                model: AssemblyModal,
                as: "assemblies",
                required: true,
                where: {
                    ...assemblyWhere,
                    createdAt: {
                        [Op.gte]: lastStart,
                        [Op.lte]: lastEnd,
                    },
                },
            }],
        }),

        PartModal.count({
            distinct: true,
            col: "_id",
            include: [{
                model: AssemblyModal,
                as: "assemblies",
                required: true,
                where: {
                    ...assemblyWhere,
                    createdAt: {
                        [Op.gte]: lastStart,
                        [Op.lte]: lastEnd,
                    },
                },
            }],
        }),
    ]);

    const diff = {
        assembly: assembly_current - assembly_last,
        employee: employee_current - employee_last,
        process: process_current - process_last,
        parts: parts_current - parts_last,
    };

    return {
        totals: {
            assembly: assembly_current,
            employee: employee_current,
            process: process_current,
            parts: parts_current,
        },
        month_difference: diff,
        period_difference: diff,
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
  
      // Fetch all history records and process in JavaScript (safer for SQL Server)
      const histories = await CheckListHistoryModal.findAll({
          where: { assembly: { [Op.in]: assemblyIds } },
          attributes: ["assembly", "is_error", "createdAt"],
      });
  
      // Group by year and month
      const monthlyMap = new Map();
      
      for (const h of histories) {
          const createdAt = new Date(h.createdAt);
          const year = createdAt.getFullYear();
          const month = createdAt.getMonth() + 1; // getMonth() returns 0-11, we need 1-12
          const key = `${year}-${month}`;
          
          if (!monthlyMap.has(key)) {
              monthlyMap.set(key, {
                  year,
                  month,
                  checkedAssemblies: new Set(),
                  errorAssemblies: new Set(),
              });
          }
          
          const entry = monthlyMap.get(key);
          const assemblyId = h.assembly?.toString() || h.assembly;
          entry.checkedAssemblies.add(assemblyId);
          if (h.is_error === true || h.is_error === 1) {
              entry.errorAssemblies.add(assemblyId);
          }
      }
  
      // Convert to array format
      const monthly = Array.from(monthlyMap.values()).map((entry) => ({
          year: entry.year,
          month: entry.month,
          checked_count: entry.checkedAssemblies.size,
          unchecked_count: Math.max(totalAssemblies - entry.checkedAssemblies.size, 0),
          error_count: entry.errorAssemblies.size,
      }));
  
      // Sort by year and month
      monthly.sort((a, b) => {
          if (a.year !== b.year) return a.year - b.year;
          return a.month - b.month;
      });
  
      return monthly.map((m) => ({
          year: m.year,
          month: m.month,
          checked_count: m.checked_count,
          unchecked_count: m.unchecked_count,
          error_count: m.error_count,
          level: "assembly",
      }));
  
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

export const GetMonthlyPerformance = async (admin, user, startDate, endDate) => {
    const assemblies = await AssemblyModal.findAll({
        where: admin ? {} : { responsibility: user },
        attributes: ["_id"],
    });
    const assemblyIds = assemblies.map((a) => a._id);
    if (assemblyIds.length === 0) return [];

    // Optional date range filter
    let rangeStart = null;
    let rangeEnd = null;
    if (startDate) {
        rangeStart = new Date(startDate);
        rangeStart.setHours(0, 0, 0, 0);
    }
    if (endDate) {
        rangeEnd = new Date(endDate);
        rangeEnd.setHours(23, 59, 59, 999);
    }

    let whereClause = `WHERE assembly IN (:assemblyIds)`;
    if (rangeStart) {
        whereClause += ` AND createdAt >= :startDate`;
    }
    if (rangeEnd) {
        whereClause += ` AND createdAt <= :endDate`;
    }

    const sql = `
        SELECT
            YEAR(createdAt) AS year,
            MONTH(createdAt) AS month,
            assembly AS assembly,
            MAX(CASE WHEN is_error = 1 THEN 1 ELSE 0 END) AS has_error
        FROM checklisthistories
        ${whereClause}
        GROUP BY YEAR(createdAt), MONTH(createdAt), assembly
        ORDER BY YEAR(createdAt), MONTH(createdAt)
    `;

    const replacements = {
        assemblyIds,
    };
    if (rangeStart) replacements.startDate = rangeStart;
    if (rangeEnd) replacements.endDate = rangeEnd;

    const perAssemblyMonth = await sequelize.query(sql, {
        replacements,
        type: QueryTypes.SELECT,
    });

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

export const GetDailyErrorsAssembly = async (admin, user, startDate, endDate) => {
    const now = new Date();

    const startOfDay = startDate ? new Date(startDate) : new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = endDate ? new Date(endDate) : new Date(now);
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



















