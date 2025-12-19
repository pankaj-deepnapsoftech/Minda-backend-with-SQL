import {Schema,model} from "mongoose";


const checkListSchema = new Schema({
    item:{type:String,required:true},
    description:{type:String},
    check_list_method:{type:String,required:true},
    check_list_time:{type:String,required:true},
    result_type:{type:String,required:true},
    min:{type:Number},
    max:{type:Number},
    uom:{type:String},
    process:{type:Schema.Types.ObjectId,ref:"Process",required:true}
},{timestamps:true});

checkListSchema.index({item:1,process:1})

export const CheckListModal = model("Checklist",checkListSchema)







