import {Schema,model} from "mongoose";


const companySchema = new Schema({
    company_name:{type:String,required:true,unique:true},
    company_address:{type:String},
    gst_no:{type:String,unique:true},
    description:{type:String},
});

export const CompanyModel = model("Company",companySchema);










