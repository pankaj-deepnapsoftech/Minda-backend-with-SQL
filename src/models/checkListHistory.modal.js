import { Schema, model } from "mongoose";




const checkListHistorySchema = new Schema({
    checkList: { type: Schema.Types.ObjectId, ref: "Checklist", required: true },
    assembly: { type: Schema.Types.ObjectId, ref: "Assembly", required: true },
    process_id: { type: Schema.Types.ObjectId, ref: "Process", required: true },
    user_id:{ type: Schema.Types.ObjectId, ref: "User", required: true },
    result: { type: String, required: true },
    is_error:{type:Boolean,required:true,default:false},
    description:{type:String},
    status:{type:String,required:true,default:"Unchecked",enum:["Checked","Unchecked"]}
}, { timestamps: true });

checkListHistorySchema.index({
    checkList:1,
    assembly:1,
    process_id:1,
    result:1,
    status:1
});
 
export const CheckListHistoryModal = model("CheckListHistory", checkListHistorySchema);










