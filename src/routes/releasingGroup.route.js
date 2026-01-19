import {Router} from "express";
import { createRelasingGroup, DeleteReleasingGroup, getReleasingGroup, UpdateReleasingGroup } from "../controller/RelesingGroup.controller.js";



const router = Router();

router.route("/create").post(createRelasingGroup);
router.route("/get").get(getReleasingGroup);
router.route("/delete/id/:id").delete(DeleteReleasingGroup);
router.route("/update/id/:id").put(UpdateReleasingGroup);


export default router;







