import { UserModel } from "../models/user.modal.js";
import { CompanyModel } from "../models/company.modal.js";
import { PlantModel } from "../models/plant.modal.js";
import { RoleModel } from "../models/role.modal.js";
import { Op } from "sequelize";



export const createUserService = async (data) => {
    const result = await UserModel.create(data);
    return result;
};

export const GetUsersService = async (skip,limit) => {
    const result = await UserModel.findAll({
        where: { is_admin: false },
        include: [
            { model: RoleModel, as: "userRole" },
            { model: CompanyModel, as: "company" },
            { model: PlantModel, as: "plant" },
        ],
        offset: skip,
        limit,
        order: [["id", "DESC"]],
    });
    return result;
};

export const GetAllUsersService = async () => {
    const result = await UserModel.findAll({
        where: { is_admin: false },
        attributes: ["id", "email", "user_id", "full_name"],
        order: [["id", "DESC"]],
    });
    return result;
};

export const SearchUsersService = async (company,plant,search="",skip,limit) => {
    const q = search || "";
    const where = {
        is_admin: false,
        [Op.or]: [
            { email: { [Op.like]: `%${q}%` } },
            { user_id: { [Op.like]: `%${q}%` } },
        ],
        ...(company ? { employee_company: company } : {}),
        ...(plant ? { employee_plant: plant } : {}),
    };

    const result = await UserModel.findAll({
        where,
        include: [
            { model: RoleModel, as: "userRole" },
            { model: CompanyModel, as: "company" },
            { model: PlantModel, as: "plant" },
        ],
        offset: skip,
        limit,
        order: [["id", "DESC"]],
    });
    return result;
};

export const UpdateUsersService = async (id,data) => {
    const user = await UserModel.findByPk(id);
    if (!user) return null;
    const result = await user.update(data);
    return result;
};

export const DeleteUsersService = async (id) => {
    const user = await UserModel.findByPk(id);
    if (!user) return null;
    await user.destroy();
    const result = user;
    return result;
};

export const FindUserByEmailOrUserId = async (email) => {
    const result = await UserModel.findOne({
        where: { [Op.or]: [{ email }, { user_id: email }] },
    });
    return result;
};


export const FindUserById = async (id) => {
    const result = await UserModel.findByPk(id, {
        attributes: [
            "id",
            "full_name",
            "email",
            "desigination",
            "user_id",
            "employee_plant",
            "employee_company",
            "role",
            "is_admin",
            "terminate",
        ],
        include: [
            { model: PlantModel, as: "plant" },
            { model: CompanyModel, as: "company" },
            { model: RoleModel, as: "userRole" },
        ],
    });
    return result;
};

export const FindUserByEmail = async (email) => {
    const result = await UserModel.findOne({ where: { email } });
    return result;
};


export const GetAdmin = async () => {
    const result = await UserModel.findOne({ where: { is_admin: true } });
    return result;
}

















