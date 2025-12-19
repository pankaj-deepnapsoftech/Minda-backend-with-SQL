import {Schema,model} from "mongoose";



const plantsSchema = new Schema({
    plant_name:{type:String,required:true},
    plant_address:{type:String},
    company_id:{type:Schema.Types.ObjectId,ref:"Company",required:true},
    description:{type:String},
},{timestamps:true});

plantsSchema.index({plant_name:1,company_id:1});

export const PlantModel = model("Plant",plantsSchema);


