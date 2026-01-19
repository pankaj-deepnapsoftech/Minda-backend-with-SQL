import {Router} from "express";
import { createRelasingGroup } from "../controller/RelesingGroup.controller.js";



const router = Router();

router.route("/create").post(createRelasingGroup);

export default router;







