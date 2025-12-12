import {Schema,model} from "mongoose";


const userSchema = new Schema({
    full_name:{type:String},
    email:{type:String,required:true,unique:true},
    password:{type:String,required:true},
    desigination:{type:String},
    user_id:{type:String,required:true,unique:true},
});

export const UserModel = model("User",userSchema);