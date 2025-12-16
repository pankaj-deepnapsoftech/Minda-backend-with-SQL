import {Schema,model} from "mongoose";


const processSchema = new Schema({
    process_name: {type:String,required:true},
    process_no:{type:String,required:true},
},{timestamps:true});

export const ProcessModel = model("process",processSchema);





