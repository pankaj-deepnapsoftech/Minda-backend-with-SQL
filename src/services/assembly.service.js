import { Op, QueryTypes } from "sequelize";
import { sequelize } from "../sequelize.js";
import { AssemblyModal } from "../models/AssemblyLine.modal.js";
import { PartModal } from "../models/Part.modal.js";
import { CheckListModal } from "../models/checkList.modal.js";
import { CheckListHistoryModal } from "../models/checkListHistory.modal.js";
import { CompanyModel } from "../models/company.modal.js";
import { PlantModel } from "../models/plant.modal.js";
import { ProcessModel } from "../models/process.modal.js";
import { UserModel } from "../models/user.modal.js";

const baseAssemblyIncludes = [
    { model: CompanyModel, as: "company", attributes: ["_id", "company_name", "company_address", "description"] },
    { model: PlantModel, as: "plant", attributes: ["_id", "plant_name", "plant_address", "description"] },
    { model: UserModel, as: "responsibleUser", attributes: ["_id", "full_name", "email", "user_id", "desigination"] },
    { model: ProcessModel, as: "process_id", attributes: ["_id", "process_name", "process_no"], through: { attributes: [] } },
    { model: PartModal, as: "part", attributes: ["_id", "part_number", "part_name"] },
];

export const createAssemblyService = async (data) => {
    const { process_id: processIds, ...assemblyData } = data || {};
    const result = await AssemblyModal.create(assemblyData);
    if (Array.isArray(processIds)) {
        const ids = processIds.filter((v) => v !== null && v !== undefined && String(v).trim() !== "");
        await result.setProcess_id(ids);
    }
    return await AssemblyModal.findByPk(result._id, { include: baseAssemblyIncludes });
};

export const updateAssemblyService = async (id, data) => {
    const assembly = await AssemblyModal.findByPk(id);
    if (!assembly) return null;
    const { process_id: processIds, ...assemblyData } = data || {};
    await assembly.update(assemblyData);
    if (Array.isArray(processIds)) {
        const ids = processIds.filter((v) => v !== null && v !== undefined && String(v).trim() !== "");
        await assembly.setProcess_id(ids);
    }
    return await AssemblyModal.findByPk(assembly._id, { include: baseAssemblyIncludes });
};

export const deleteAssemblyService = async (id) => {
    const assembly = await AssemblyModal.findByPk(id);
    if (!assembly) return null;
    await assembly.setProcess_id([]);
    await assembly.destroy();
    return assembly;
};

export const getAllAssemblyService = async (IsAdmin, userId, skip, limit) => {
    const result = await AssemblyModal.findAll({
        where: IsAdmin ? {} : { responsibility: userId },
        order: [["_id", "DESC"]],
        offset: skip,
        limit,
        include: baseAssemblyIncludes,
    });
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
    const where = {
        [Op.or]: [
            { assembly_name: { [Op.like]: `%${search || ""}%` } },
            { assembly_number: { [Op.like]: `%${search || ""}%` } },
        ],
        ...(company_id ? { company_id } : {}),
        ...(plant_id ? { plant_id } : {}),
        ...(responsibility ? { responsibility } : {}),
        ...(part_id ? { part_id } : {}),
        ...(IsAdmin ? {} : { responsibility: userId }),
    };

    if (process_id) {
        const rows = await sequelize.query(
            "SELECT assembly_id FROM assembly_processes WHERE process_id = :process_id",
            { replacements: { process_id }, type: QueryTypes.SELECT }
        );
        const ids = rows.map((r) => r.assembly_id);
        if (ids.length === 0) return [];
        where._id = { [Op.in]: ids };
    }

    const result = await AssemblyModal.findAll({
        where,
        order: [["_id", "DESC"]],
        offset: Number(skip),
        limit: Number(limit),
        include: baseAssemblyIncludes,
    });

    return result;
};

export const findAssemblyByName = async (name, number) => {
    const result = await AssemblyModal.findOne({
        where: { assembly_name: name, assembly_number: number },
    });
    return result;
};

export const getAllAssemblyDataService = async () => {
    const result = await AssemblyModal.findAll({
        attributes: ["_id", "assembly_number", "assembly_name"],
        order: [["_id", "DESC"]],
    });
    return result;
};

export const getAssemblyLineByResponsibility = async (responsibility) => {
    const assemblies = await AssemblyModal.findAll({
        where: { responsibility },
        attributes: ["_id", "assembly_name", "assembly_number"],
        include: [
            { model: ProcessModel, as: "process_id", attributes: ["_id", "process_name", "process_no"], through: { attributes: [] } },
        ],
        order: [["_id", "DESC"]],
    });
    return assemblies;
};

export const getAssemblyLineFormByResponsibility = async (user, id) => {
    const assembly = await AssemblyModal.findOne({
        where: { _id: id, responsibility: user },
        include: [
            { model: UserModel, as: "responsibleUser", attributes: ["_id", "full_name", "email", "user_id"] },
            { model: CompanyModel, as: "company", attributes: ["_id", "company_name", "company_address"] },
            { model: PlantModel, as: "plant", attributes: ["_id", "plant_name", "plant_address"] },
            { model: ProcessModel, as: "process_id", attributes: ["_id", "process_name", "process_no"], through: { attributes: [] } },
        ],
    });

    if (!assembly) return [];

    const assemblyJson = assembly.toJSON();
    const processIds = Array.isArray(assemblyJson.process_id) ? assemblyJson.process_id.map((p) => p._id) : [];
    const checklists = processIds.length
        ? await CheckListModal.findAll({
            where: { process: { [Op.in]: processIds } },
            order: [["_id", "ASC"]],
        })
        : [];

    const checklistByProcess = new Map();
    for (const cl of checklists) {
        const json = cl.toJSON();
        const pid = json.process;
        const list = checklistByProcess.get(pid) || [];
        list.push(json);
        checklistByProcess.set(pid, list);
    }

    assemblyJson.process_id = (assemblyJson.process_id || []).map((p) => {
        const proc = { ...p };
        proc.checklist_item = checklistByProcess.get(proc._id) || [];
        return proc;
    });

    return [assemblyJson];
};

export const GetAssemblyLineDataReport = async (admin, user_id) => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const assemblies = await AssemblyModal.findAll({
        where: admin ? {} : { responsibility: user_id },
        attributes: ["_id"],
        include: [{ model: ProcessModel, as: "process_id", attributes: ["_id"], through: { attributes: [] } }],
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

    const historyMap = new Map();
    for (const h of histories) {
        const key = `${h.assembly}:${h.process_id}`;
        const list = historyMap.get(key) || [];
        list.push(h);
        historyMap.set(key, list);
    }

    let total_assemblies = 0;
    let total_checked = 0;
    let total_unchecked = 0;
    let total_errors = 0;
    let total_resolved = 0;

    for (const assembly of assemblies) {
        total_assemblies += 1;
        const processList = Array.isArray(assembly.process_id) ? assembly.process_id : [];

        const processFlags = processList.map((p) => {
            const key = `${assembly._id}:${p._id}`;
            const today = historyMap.get(key) || [];
            const is_checked = today.length > 0;
            const is_unchecked = today.length === 0;
            const has_error = today.some((t) => t.is_error === true);
            const has_unresolved_error = today.some((t) => t.is_error === true && t.is_resolved === false);
            return { is_checked, is_unchecked, has_error, has_unresolved_error };
        });

        const assembly_unchecked = processFlags.some((p) => p.is_unchecked) || processFlags.length === 0;
        const assembly_checked = !assembly_unchecked;
        const assembly_error = processFlags.some((p) => p.has_error);
        const assembly_resolved = assembly_error && !processFlags.some((p) => p.has_unresolved_error);

        if (assembly_checked) total_checked += 1;
        if (assembly_unchecked) total_unchecked += 1;
        if (assembly_error) total_errors += 1;
        if (assembly_resolved) total_resolved += 1;
    }

    return { total_assemblies, total_checked, total_unchecked, total_errors, total_resolved };
};

export const getAssemblyLineTodayReport = async (
    admin,
    user_id,
    skip,
    limit,
    startdate,
    endDate
) => {
    const today = new Date();
    const startOfDay = startdate ? new Date(startdate) : new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = endDate ? new Date(endDate) : new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const assemblies = await AssemblyModal.findAll({
        where: admin ? {} : { responsibility: user_id },
        order: [["_id", "DESC"]],
        offset: skip,
        limit,
        include: [
            { model: CompanyModel, as: "company", attributes: ["_id", "company_name", "company_address", "description"] },
            { model: PlantModel, as: "plant", attributes: ["_id", "plant_name", "plant_address", "description"] },
            { model: UserModel, as: "responsibleUser", attributes: ["_id", "full_name", "email", "user_id", "desigination"] },
            { model: ProcessModel, as: "process_id", attributes: ["_id", "process_name", "process_no"], through: { attributes: [] } },
        ],
    });

    const assemblyJsonList = assemblies.map((a) => a.toJSON());
    const assemblyIds = assemblyJsonList.map((a) => a._id);

    const processIds = [
        ...new Set(
            assemblyJsonList.flatMap((a) => (Array.isArray(a.process_id) ? a.process_id.map((p) => p._id) : []))
        ),
    ];

    const checklists = processIds.length
        ? await CheckListModal.findAll({
            where: { process: { [Op.in]: processIds } },
            order: [["_id", "ASC"]],
        })
        : [];

    const histories = assemblyIds.length
        ? await CheckListHistoryModal.findAll({
            where: {
                assembly: { [Op.in]: assemblyIds },
                createdAt: { [Op.between]: [startOfDay, endOfDay] },
            },
            attributes: ["_id", "checkList", "assembly", "process_id", "result", "is_error", "description", "status", "createdAt"],
        })
        : [];

    const checklistByProcess = new Map();
    for (const cl of checklists) {
        const json = cl.toJSON();
        const pid = json.process;
        const list = checklistByProcess.get(pid) || [];
        list.push(json);
        checklistByProcess.set(pid, list);
    }

    const historyByAssemblyProcessCheckList = new Map();
    for (const h of histories) {
        const json = h.toJSON();
        const key = `${json.assembly}:${json.process_id}:${json.checkList}`;
        const list = historyByAssemblyProcessCheckList.get(key) || [];
        list.push(json);
        historyByAssemblyProcessCheckList.set(key, list);
    }

    return assemblyJsonList.map((assembly) => {
        const processes = Array.isArray(assembly.process_id) ? assembly.process_id : [];
        assembly.process_id = processes.map((proc) => {
            const procChecklists = checklistByProcess.get(proc._id) || [];
            return {
                ...proc,
                check_list_items: procChecklists.map((cli) => ({
                    ...cli,
                    check_items_history:
                        historyByAssemblyProcessCheckList.get(`${assembly._id}:${proc._id}:${cli._id}`) || [],
                })),
            };
        });
        return assembly;
    });
};





