import { Router } from "express";
import { getNotificationData } from "../controller/notification.controller.js";


const routes = Router();

routes.route("/get-notifications").get(getNotificationData)


export default routes;