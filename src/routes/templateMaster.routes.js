import { Router } from "express";
import {
  addFieldToTemplate,
  createTemplate,
  deleteField,
  deleteTemplate,
  getTemplateById,
  listTemplates,
} from "../controller/templateMaster.controller.js";

const router = Router();

// More specific routes first
router.post("/templates/:id/fields", addFieldToTemplate);
router.delete("/fields/:fieldId", deleteField);
router.delete("/templates/:id", deleteTemplate);
router.get("/templates/:id", getTemplateById);
router.post("/templates", createTemplate);
router.get("/templates", listTemplates);

export default router;

