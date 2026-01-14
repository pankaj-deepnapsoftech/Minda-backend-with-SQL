import { PartModal } from "../models/Part.modal.js"
// import { AssemblyModal } from "../models/AssemblyLine.modal.js";
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

export const GetAllPartsService = async () => {
  const result = await PartModal.findAll({
      attributes: ["_id", "part_number", "part_name"],
      order: [
          ["createdAt", "ASC"]
        ],
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
        order: [["createdAt", "ASC"]],
        offset: skip,
        limit,
    });

   return parts;
}



