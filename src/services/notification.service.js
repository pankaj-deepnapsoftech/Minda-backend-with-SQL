import { NotificationModal } from "../models/notification.modal.js"


export const CreateNotification = async (data) => {
    const result = await NotificationModal.create(data);
    return result;
};

export const GetNotification = async (user,skip,limit) => {
    const result = await NotificationModal.find({reciverId:user}).sort({_id:-1}).skip(skip).limit(limit).lean();
    return result;
};

export const UpdateNotification = async(id,data) => {
    const result = await NotificationModal.findByIdAndUpdate(id,data,{new:true});
    return result;
};

export const GetUpdateAll = async () => {
    const result = await NotificationModal.updateMany();
}
