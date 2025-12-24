import {Router} from "express";

// ----------------------------- 
import { getAllActiveAssembyMonthly, GetAllCardsData, getAssemblyData, GetMonthlyTrendData } from "../controller/dashboard.controller.js";


const routes = Router();

routes.route("/get-cards-data").get(GetAllCardsData);
routes.route("/get-monthly-trend").get(GetMonthlyTrendData);
routes.route("/get-assembly-status").get(getAssemblyData);
routes.route("/get-assembly-monthly").get(getAllActiveAssembyMonthly);



export default routes;