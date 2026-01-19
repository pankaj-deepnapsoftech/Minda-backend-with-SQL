import {Router} from "express";
import { createRelasingGroup, getReleasingGroup } from "../controller/RelesingGroup.controller.js";



const router = Router();

router.route("/create").post(createRelasingGroup);
router.route("/get").get(getReleasingGroup)

export default router;







