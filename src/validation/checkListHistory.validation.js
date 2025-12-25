import * as yup from "yup";

const isNumericId = (value) => /^[0-9]+$/.test(String(value));

export const checkListHistoryItemSchema = yup.object({
  checkList: yup
    .mixed()
    .test("is-id", "Invalid checklist ID", (value) => value !== null && value !== undefined && value !== "" && isNumericId(value))
    .required("Checklist is required"),

  process_id: yup
    .mixed()
    .test("is-id", "Invalid process ID", (value) => value !== null && value !== undefined && value !== "" && isNumericId(value))
    .required("Process is required"),

  assembly: yup
    .mixed()
    .test("is-id", "Invalid assembly ID", (value) => value !== null && value !== undefined && value !== "" && isNumericId(value))
    .required("Assembly is required"),

  result: yup
    .string()
    .required("Result is required"),
});

export const checkListHistoryRequestSchema = yup.object({
  data: yup
    .array()
    .of(checkListHistoryItemSchema)
    .min(1, "At least one checklist history record is required")
    .required("Data array is required"),
});
