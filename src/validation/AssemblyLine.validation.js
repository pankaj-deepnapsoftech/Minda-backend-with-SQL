import * as yup from "yup";

const isNumericId = (value) => /^[0-9]+$/.test(String(value));

export const assemblyValidationSchema = yup.object().shape({
  assembly_name: yup
    .string()
    .trim()
    .required("Assembly name is required"),

  assembly_number: yup
    .string()
    .trim()
    .required("Assembly number is required"),

  company_id: yup
    .mixed()
    .test("is-id", "Invalid company ID", (value) => value !== null && value !== undefined && value !== "" && isNumericId(value))
    .required("Company is required"),

  plant_id: yup
    .mixed()
    .test("is-id", "Invalid plant ID", (value) => value !== null && value !== undefined && value !== "" && isNumericId(value))
    .required("Plant is required"),




 

});
