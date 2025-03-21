import express from "express";
const router = express.Router();
import multer from "multer";
const upload = multer({ dest: 'uploads/' });

import { decactivePost, deleteSinglePost, getAdvertsPostedByUser, postAds } from "../controllers/adsController.js";


router.post("/upload",upload.array('adImages', 7), postAds);

router.get("/store-ads-only",getAdvertsPostedByUser)

router.get('/delete-post/:id', deleteSinglePost)

router.get('/deactivate-post/:id', decactivePost)





export default router;