import * as yup from "yup";

const numericId = yup
  .mixed()
  .test("is-id", "Invalid ID", (value) => {
    if (value === null || value === undefined || value === "") return true;
    return /^[0-9]+$/.test(String(value));
  });

export const userValidationSchema = yup.object({
  full_name: yup
    .string()
    .trim()
    .max(100, "Full name is too long")
    .nullable(),

  email: yup
    .string()
    .trim()
    .email("Invalid email format")
    .required("Email is required"),

  password: yup
    .string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),

  desigination: yup
    .string()
    .trim()
    .max(100, "Designation is too long")
    .nullable(),

  user_id: yup
    .string()
    .trim()
    .nullable(),

  employee_plant: numericId.nullable(),

  employee_company: numericId.nullable(),

  role: numericId.nullable(),

  terminate: yup
    .boolean()
    .default(false)
});
