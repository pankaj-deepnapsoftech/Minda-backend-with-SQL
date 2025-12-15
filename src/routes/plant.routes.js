import {Router} from "express";

// ------------------  local imports -------------------
import { Validater } from "../middleware/validator.js";
import { AllPlantData, createPlant, deletePlant, listPlant, searchPlant, updatePlant } from "../controller/plant.controller.js";
import { plantValidationSchema } from "../validation/plant.validation.js";

const routes = Router();


routes.route("/create-plant").post(Validater(plantValidationSchema),createPlant);
routes.route("/list-plant").get(listPlant);
routes.route("/update-plant/:id").put(Validater(plantValidationSchema),updatePlant);
routes.route("/delete-plant/:id").delete(deletePlant);
routes.route("/search-plant").get(searchPlant);
routes.route("/all-plants-data/:id").get(AllPlantData)


export default routes;


