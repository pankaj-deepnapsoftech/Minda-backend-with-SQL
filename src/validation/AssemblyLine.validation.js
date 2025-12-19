import * as yup from "yup";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

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
    .string()
    .matches(objectIdRegex, "Invalid company ID")
    .required("Company is required"),

  plant_id: yup
    .string()
    .matches(objectIdRegex, "Invalid plant ID")
    .required("Plant is required"),

  responsibility: yup
    .string()
    .matches(objectIdRegex, "Invalid user ID")
  ,


  process_id: yup
    .array()
    .of(
      yup
        .string()
        .matches(objectIdRegex, "Invalid process ID")
        .required("Process ID is required")
    )
    .min(1, "At least one process ID is required"),

  part_id: yup
    .string()
    .matches(objectIdRegex, "Invalid plant ID")

});
