import { Router } from "express";
import {
  createTemplateSubmission,
  updateTemplateSubmission,
  getTemplateSubmission,
  getUserTemplateSubmissions,
  submitTemplateSubmission,
} from "../controller/templateSubmission.controller.js";

const router = Router();

router.post("/", createTemplateSubmission);
router.get("/", getUserTemplateSubmissions);
router.get("/:id", getTemplateSubmission);
router.put("/:id", updateTemplateSubmission);
router.post("/:id/submit", submitTemplateSubmission);

export default router;
