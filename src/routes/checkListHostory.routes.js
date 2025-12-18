import { Router } from "express";

// ---------------------- local imports ----------------------------
import { createCheckListHistory } from "../controller/checkListHistory.controller.js";
import { Validater } from "../middleware/validator.js";
import {  checkListHistoryRequestSchema } from "../validation/checkListHistory.validation.js";

const routes = Router();

routes.route("/create-checklist-history").post(Validater(checkListHistoryRequestSchema),createCheckListHistory)


export default routes;

























