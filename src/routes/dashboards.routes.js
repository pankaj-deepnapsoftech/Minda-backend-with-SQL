import {Router} from "express";

// ----------------------------- 
import { GetAllCardsData, GetMonthlyTrendData } from "../controller/dashboard.controller.js";


const routes = Router();

routes.route("/get-cards-data").get(GetAllCardsData);
routes.route("/get-monthly-trend").get(GetMonthlyTrendData)



export default routes;