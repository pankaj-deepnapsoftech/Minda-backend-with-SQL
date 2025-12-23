
import {Schema,model} from "mongoose";

const notificationSchema = new Schema ({
    title:{type:String,required:true},
    description:{type:String},
    reciverId:{type:Schema.Types.ObjectId,ref:"User",required:true},
    senderId:{type:Schema.Types.ObjectId,ref:"User"},
    status:{type:String,required:true,default:"send",enum:["send",'recived','view']}
});

export const NotificationModal = model("Notification",notificationSchema);








