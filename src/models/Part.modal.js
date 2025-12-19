import {Schema,model} from "mongoose";


const partSchema = new Schema({
    part_name:{type:String,required:true},
    part_number:{type:String,required:true},
});

partSchema.index({part_name:1,part_number:1})

export const PartModal = model("Part",partSchema);

