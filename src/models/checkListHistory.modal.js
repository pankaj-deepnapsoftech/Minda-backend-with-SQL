import { Schema, model } from "mongoose";




const checkListHistorySchema = new Schema({
    checkList: { type: Schema.Types.ObjectId, ref: "Checklist", required: true },
    assembly: { type: Schema.Types.ObjectId, ref: "Assembly", required: true },
    process_id: { type: Schema.Types.ObjectId, ref: "Process", required: true },
    user_id:{ type: Schema.Types.ObjectId, ref: "User", required: true },
    result: { type: String, required: true }
}, { timestamps: true });

checkListHistorySchema.index({
    checkList:1,
    assembly:1,
    process_id:1,
    result:1
});

export const CheckListHistoryModal = model("CheckListHistory", checkListHistorySchema);










