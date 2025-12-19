import {Schema,model} from "mongoose";


const processSchema = new Schema({
    process_name: {type:String,required:true},
    process_no:{type:String,required:true},
},{timestamps:true});

processSchema.index({process_name:1,process_no:1});

export const ProcessModel = model("Process",processSchema);





