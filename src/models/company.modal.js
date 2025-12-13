import {Schema,model} from "mongoose";


const companySchema = new Schema({
    company_name:{type:String,required:true,unique:true,index:true},
    company_address:{type:String,required:true},
    gst_no:{type:String,unique:true, sparse: true},
    description:{type:String},
},{timestamps:true});

export const CompanyModel = model("Company",companySchema);










