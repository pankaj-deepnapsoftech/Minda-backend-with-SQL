import { PartModal } from "../models/Part.modal.js"
import { AssemblyModal } from "../models/AssemblyLine.modal.js";
import { Op } from "sequelize";


export const createPartsService = async (data) => {
    const result = await PartModal.create(data);
    return result;
};

export const UpdatePartService = async (id,data) => {
    const part = await PartModal.findByPk(id);
    if (!part) return null;
    const result = await part.update(data);
    return result;
};

export const DeletePartService = async (id) => {
    const part = await PartModal.findByPk(id);
    if (!part) return null;
    await part.destroy();
    const result = part;
    return result;
};

export const GetAllPartsService = async() => {
    const result = await PartModal.findAll({
        attributes: ["_id", "part_number", "part_name"],
        order: [["_id", "ASC"]],
    });
    return result;
};

export const FindPartServiceByName =  async (data) => {
    const result = await PartModal.findOne({ where: data });
    return result;
}

export const getPartsServiceData = async (search="",skip,limit) => {
    const q = search || "";
    const parts = await PartModal.findAll({
        where: {
            [Op.or]: [
                { part_name: { [Op.like]: `%${q}%` } },
                { part_number: { [Op.like]: `%${q}%` } },
            ],
        },
        include: [
            {
                model: AssemblyModal,
                as: "assemblies",
                attributes: ["_id", "assembly_name", "assembly_number"],
                required: false,
            },
        ],
        order: [["_id", "ASC"]],
        offset: skip,
        limit,
    });

    return parts.map((p) => {
        const json = p.toJSON();
        json.total_assemblies = Array.isArray(json.assemblies) ? json.assemblies.length : 0;
        return json;
    });
}



