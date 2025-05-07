import express from "express";
import { countElectronics } from "../controllers/countAdsController.js";
const router = express.Router()

router.get("/countElectronics", countElectronics);


export default router;