import {Schema,model} from "mongoose";


const partSchema = new Schema({
    part_name:{type:String,required:true},
    part_number:{type:String,required:true},
});

export const PartModal = model("Part",partSchema);

