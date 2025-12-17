import { Router } from "express";

// ---------------------------- local imports ---------------------------
import { CreateChecklistData } from "../controller/checklist.controller.js";

const routes = Router();

routes.route("/create-checklist").post(CreateChecklistData)


export default routes