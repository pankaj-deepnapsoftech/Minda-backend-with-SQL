import { Router } from "express";

// ---------------------- local imports ----------------------------
import { createCheckListHistory } from "../controller/checkListHistory.controller.js";
import { Validater } from "../middleware/validator.js";
import { checkListHistoryValidationSchema } from "../validation/checkListHistory.validation.js";

const routes = Router();

routes.route("/create-checklist-history").post(Validater(checkListHistoryValidationSchema),createCheckListHistory)


export default routes;

























