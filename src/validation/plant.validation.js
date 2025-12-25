import * as Yup from "yup";

export const plantValidationSchema = Yup.object().shape({
  plant_name: Yup.string()
    .required("Plant name is required")
    .trim(),

  plant_address: Yup.string()
    .nullable()
    .trim(),

  company_id: Yup.mixed()
    .required("Company ID is required")
    .test("is-id", "Invalid company ID", (value) => {
      if (value === null || value === undefined || value === "") return false;
      return /^[0-9]+$/.test(String(value));
    }),

  description: Yup.string()
    .nullable()
});
