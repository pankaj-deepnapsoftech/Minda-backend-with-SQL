import * as Yup from "yup";

export const plantValidationSchema = Yup.object().shape({
  plant_name: Yup.string()
    .required("Plant name is required")
    .trim(),

  plant_address: Yup.string()
    .nullable()
    .trim(),

  company_id: Yup.string()
    .required("Company ID is required")
    .matches(/^[0-9a-fA-F]{24}$/, "Invalid company ID (must be a valid MongoDB ObjectId)"),

  description: Yup.string()
    .nullable()
});
