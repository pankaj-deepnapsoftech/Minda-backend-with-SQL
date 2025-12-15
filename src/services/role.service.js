import { RoleModel } from "../models/role.modal.js"



export const createRoleService = async (data) => {
    const result = await RoleModel.create(data);
    return result;
};

export const getRolesListService = async (skip,limit) => {
    const result = await RoleModel.find().skip(skip).limit(limit).lean();
    return result;
};

export const updateRoleService = async (id,data) => {
    const result = await RoleModel.findByIdAndUpdate(id,data,{new:true});
    return result;
};

export const deleteRoleService = async (id) => {
    const result = await RoleModel.findByIdAndDelete(id);
    return result;
};

export const findRoleBuName = async (name) => {
    const result = await RoleModel.findOne({name}).lean();
    return result;
};

export const searchRoleByName = async (name,skip,limit) => {
    const result = await RoleModel.find({name:{$regex:name,$options:'i'}}).sort({_id:-1}).skip(skip).limit(limit).lean();
    return result;
}

export const getAllRoleService = async () => {
    const result = await RoleModel.find({}).select("name").lean();
    return result;
}





