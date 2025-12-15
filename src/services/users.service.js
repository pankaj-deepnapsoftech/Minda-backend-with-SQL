import { UserModel } from "../models/user.modal.js";



export const createUserService = async (data) => {
    const result = await UserModel.create(data);
    return result;
};

export const GetUsersService = async (skip,limit) => {
    const result = await UserModel.find({  role: { $exists: true }}).skip(skip).limit(limit).populate([{path:"role"},{path:"employee_company"},{path:"employee_plant"}]).lean();
    return result;
};


export const SearchUsersService = async (search,skip,limit) => {
    const result = await UserModel.find({  role: { $exists: true },$or:[{email:{$regex:search,$options:'i'}},{user_id:{$regex:search,$options:'i'}}]}).skip(skip).limit(limit).populate([{path:"role"},{path:"employee_company"},{path:"employee_plant"}]).lean();
    return result;
};

export const UpdateUsersService = async (id,data) => {
    const result = await UserModel.findByIdAndUpdate(id,data,{new:true});
    return result;
};

export const DeleteUsersService = async (id) => {
    const result = await UserModel.findByIdAndDelete(id);
    return result;
};

export const FindUserByEmailOrUserId = async (email) => {
    const result = await UserModel.findOne({$or:[{email},{user_id:email}]}).lean();
    return result;
};


export const FindUserById = async (id) => {
    const result = await UserModel.findById(id).select("full_name email desigination user_id employee_plant employee_company role").populate([{path:"employee_plant"},{path:"employee_company"},{path:"role"}]);
    return result;
}

















