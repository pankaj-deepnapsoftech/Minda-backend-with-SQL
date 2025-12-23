import { NotificationModal } from "../models/notification.modal.js"


export const CreateNotification = async (data) => {
    const result = await NotificationModal.create(data);
    return result;
};

export const GetNotification = async (skip,limit) => {
    const result = await NotificationModal.find().sort({_id:-1}).skip(skip).limit(limit);
    return result;
};

