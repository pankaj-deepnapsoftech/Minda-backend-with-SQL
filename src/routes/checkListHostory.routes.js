import { Router } from "express";

// ---------------------- local imports ----------------------------
import { createCheckListHistory, GetCheckHistoryData, updateCheckListHistory } from "../controller/checkListHistory.controller.js";
import { Validater } from "../middleware/validator.js";
import {checkListHistoryRequestSchema } from "../validation/checkListHistory.validation.js";

const routes = Router();

routes.route("/create-checklist-history").post(Validater(checkListHistoryRequestSchema),createCheckListHistory);
routes.route("/update-checklist-history/:id").put(updateCheckListHistory);
routes.route("/get-all-data").get(GetCheckHistoryData)


export default routes;

























