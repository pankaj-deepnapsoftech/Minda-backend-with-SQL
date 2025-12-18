import { Schema, model } from "mongoose";




const checkListHistorySchema = new Schema({
    checkList: { type: Schema.Types.ObjectId, ref: "Checklist", required: true },
    assembly: { type: Schema.type.ObjectId, ref: "Assembly", required: true },
    process_id: { type: Schema.Types.ObjectId, ref: "Process", required: true },
    result: { type: String, required: true }
}, { timestamps: true });


export const CheckListHistoryModal = model("CheckListHistory", checkListHistorySchema);










