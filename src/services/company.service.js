import { CompanyModel } from "../models/company.modal.js"


export const companyCreateService = async (data) => {
    const result = await CompanyModel.create(data);
    return result;
};


export const companyListService = async (skip, limit) => {
    const result = await CompanyModel.find({}).sort({ _id: -1 }).skip(skip).limit(limit).lean();
    return result;
};

export const companyDeleteService = async (id) => {
    const result = await CompanyModel.findByIdAndDelete(id);
    return result;
};

export const comanyUpdateService = async (id, data) => {
    const result = await CompanyModel.findByIdAndUpdate(id, data, { new: true });
    return result;
};

export const FindCompanyByName = async (company_name) => {
    const result = await CompanyModel.findOne({ company_name }).lean();
    return result;
};

export const GetAllSearchItems =  async (search,skip,limit) => {
    const result = await CompanyModel.find({$or:[{company_name:{$regex:search,$options:"i"}},{company_address:{$regex:search,$options:"i"}}]}).skip(skip).limit(limit).lean();
    return result;
};






