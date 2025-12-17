
import { Router } from "express";

// ---------------------------- local imports ---------------------------
import { Validater } from "../middleware/validator.js";
import { partValidationSchema } from "../validation/part.validation.js";
import { CreateParts, DeleteParts, UpdateParts } from "../controller/part.controller.js";

const routes = Router();

routes.route("/create-part").post(Validater(partValidationSchema),CreateParts);
routes.route("/update-part/:id").put(Validater(partValidationSchema),UpdateParts);
routes.route("/delete-part/:id").delete(DeleteParts)


export default routes