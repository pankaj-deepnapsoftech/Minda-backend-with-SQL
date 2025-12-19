import {Schema,model} from "mongoose";


const assemblySchema = new Schema({
    assembly_name:{type:String,required:true},
    assembly_number:{type:String,required:true},
    company_id:{type:Schema.Types.ObjectId,ref:"Company",required:true},
    plant_id:{type:Schema.Types.ObjectId,ref:"Plant",requred:true},
    responsibility:{type:Schema.Types.ObjectId,ref:"User"},
    process_id:{type:[Schema.Types.ObjectId],ref:"Process"},
    part_id:{type:Schema.Types.ObjectId,ref:"Part"},
},{timestamps:true});

assemblySchema.index({company_id:1,plant_id:1,responsibility:1,process_id:1,part_id:1,assembly_name:1,assembly_number:1})

export const AssemblyModal = model("Assembly",assemblySchema);