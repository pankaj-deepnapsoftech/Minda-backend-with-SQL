import {Schema,model} from "mongoose";


const assemblySchema = new Schema({
    assembly_name:{type:String,required:true},
    assembly_number:{type:String,required:true},
    company_id:{type:Schema.Types.ObjectId,ref:"Company",required:true},
    plant_id:{type:Schema.Types.ObjectId,ref:"Plant",requred:true},
    responsibility:{type:Schema.Types.ObjectId,ref:"User",required:true},
    process_id:{type:[Schema.Types.ObjectId],ref:"Process",required:true},
    part_id:{type:Schema.Types.ObjectId,ref:"Part",required:true},
},{timestamps:true});


export const AssemblyModal = model("Assembly",assemblySchema);