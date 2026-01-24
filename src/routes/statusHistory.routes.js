import { Router } from "express";

// --------------- local imports here ------------------
import { createStatusHistory } from "../controller/statusHistory.controller.js";


const routes  =  Router();


routes.route("/create").post(createStatusHistory)



export default routes