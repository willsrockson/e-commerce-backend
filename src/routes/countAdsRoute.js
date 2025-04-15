import express from "express";
import { countAds } from "../controllers/countAdsController.js";
const router = express.Router()

router.get("/allAds", countAds)


export default router;