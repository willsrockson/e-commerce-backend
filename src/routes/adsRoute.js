import express from "express";
const router = express.Router();
import multer from "multer";
const upload = multer({ dest: 'uploads/' });

import { postAds } from "../controllers/adsController.js";


router.post("/upload",upload.array('adImages', 7), postAds);





export default router;