import { companyCreateService, FindCompanyByName } from "../services/company.service.js";
import { AsyncHandler } from "../utils/asyncHandler.js"
import { BadRequestError } from "../utils/errorHandler.js";



export const createCompany = AsyncHandler(async (req, res) => {
    const data = req.body;
    const exist = await FindCompanyByName(data.company_name);
    if (exist) {
        throw new BadRequestError("Company with this name already exists", "createCompany() method error");
    }
    const result = await companyCreateService(data);
    return res.status(201).json({
        message: "Company created successfully",
        data: result
    });
});









