import * as yup from "yup";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const checkListHistoryItemSchema = yup.object({
  checkList: yup
    .string()
    .matches(objectIdRegex, "Invalid checklist ID")
    .required("Checklist is required"),

  process_id: yup
    .string()
    .matches(objectIdRegex, "Invalid process ID")
    .required("Process is required"),

  assembly: yup
    .string()
    .matches(objectIdRegex, "Invalid assembly ID")
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
