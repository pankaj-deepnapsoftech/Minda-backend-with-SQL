
import { Schema, model } from "mongoose";

const notificationSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String },
    reciverId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User" },
    status: { type: String, required: true, default: "send", enum: ["send", 'recived', 'view'] },
    assembly: { type: Schema.Types.ObjectId, ref: "Assembly", required: true },
    process_id: { type: Schema.Types.ObjectId, ref: "Process", required: true },
    checkList: { type: Schema.Types.ObjectId, ref: "Checklist", required: true },
});

export const NotificationModal = model("Notification", notificationSchema);








