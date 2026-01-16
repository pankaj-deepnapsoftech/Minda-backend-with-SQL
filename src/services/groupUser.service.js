import { GroupUsersModel } from "../models/groupUsers.model.js"

export const CreateGroupUsersService = async (data) => {
    const result = await GroupUsersModel.create(data);
    return result;
};


export const GetGroupUsersService = async (id) => {
    // const result = await G
}







