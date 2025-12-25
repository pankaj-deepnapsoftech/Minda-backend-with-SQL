import { NotificationModal } from "../models/notification.modal.js"
import { AssemblyModal } from "../models/AssemblyLine.modal.js";
import { CheckListModal } from "../models/checkList.modal.js";
import { ProcessModel } from "../models/process.modal.js";
import { UserModel } from "../models/user.modal.js";


export const CreateNotification = async (data) => {
    const result = await NotificationModal.create(data);
    return result;
};

export const GetNotification = async (user,skip,limit) => {
    const result = await NotificationModal.findAll({
        where: { reciverId: user },
        include: [
            { model: UserModel, as: "sender", attributes: ["_id", "desigination", "user_id", "email", "full_name"] },
            { model: AssemblyModal, as: "assemblyLine", attributes: ["_id", "assembly_name", "assembly_number"] },
            { model: ProcessModel, as: "processInfo", attributes: ["_id", "process_name", "process_no"] },
            { model: CheckListModal, as: "checklistItem", attributes: ["_id", "item", "description", "check_list_method", "check_list_time"] },
        ],
        order: [["_id", "DESC"]],
        offset: skip,
        limit,
    });
    return result;
};

export const UpdateNotification = async(id,data) => {
    const notification = await NotificationModal.findByPk(id);
    if (!notification) return null;
    const result = await notification.update(data);
    return result;
};

export const GetUpdateAll = async (id,data) => {
    const [count] = await NotificationModal.update(data, { where: { reciverId: id } });
    const result = { updated: count };
    return result;
};
