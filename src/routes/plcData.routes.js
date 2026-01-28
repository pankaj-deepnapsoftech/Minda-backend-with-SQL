import { Router } from "express";
import {
  createPlcData,
  getAllPlcData,
  getPlcDataById,
  updatePlcData,
  deletePlcData,
} from "../controller/plcData.controller.js";

const router = Router();

router.post("/", createPlcData);
router.get("/", getAllPlcData);
router.get("", getAllPlcData);
router.get("/:id", getPlcDataById);
router.put("/:id", updatePlcData);
router.delete("/:id", deletePlcData);

export default router;
