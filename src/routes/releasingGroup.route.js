import {Router} from "express";
import { createRelasingGroup, DeleteReleasingGroup, getReleasingGroup } from "../controller/RelesingGroup.controller.js";



const router = Router();

router.route("/create").post(createRelasingGroup);
router.route("/get").get(getReleasingGroup);
router.route("/delete/id/:id").delete(DeleteReleasingGroup);


export default router;







