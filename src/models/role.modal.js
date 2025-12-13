import {Schema,model} from "mongoose";



const roleSchema = new Schema({
    name:{type:String,required:true},
    description:{type:String},
    permissions:{type:[String],default:[]},
},{timestamps:true});

export const RoleModel = model("Role",roleSchema);









