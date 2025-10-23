import express from "express";
const router = express.Router();
import multer from "multer";
import { uploadFilter } from "../../../lib/multer.filter";

const upload = uploadFilter({fileSize: 5 * 1024 * 1024, numOfFiles: 7})

import { postMobilePhonesAds } from "../../../controllers/postAds/electronics/postMobilePhonesAdController";

//Don't forget to extract file checker as middleware

//router.post("/upload", upload.array('adImages', 7), postAds);
router.post("/mobilephones", (req, res) => {
    upload.array('adImages', 7)(req, res, (err) => {
        if (err instanceof multer.MulterError) { 
            res.status(400).json({ error: err.message });
            return;
        }
        postMobilePhonesAds(req, res);
    });
});


export default router;