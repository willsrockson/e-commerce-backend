import express from "express";
const router = express.Router();
import multer from "multer";

// File filter to accept only images
const fileFilter = (req, adImages, cb) => {
    if (adImages.mimetype.startsWith('image/')) {
        cb(null, true); // Accept the file
    } else {
        cb( new Error('Only images are allowed!'), false); // Reject files that aren't image
    }
};

const upload = multer({ dest: 'uploads/' , fileFilter , limits: { fileSize: 5 * 1024 * 1024, files: 7 }});



import { postMobilePhonesAds } from "../../../controllers/postAds/electronics/postMobilePhonesAdController.js";



//router.post("/upload", upload.array('adImages', 7), postAds);
router.post("/mobilephones", (req, res) => {
    upload.array('adImages', 7)(req, res, (err) => {
        if (err) { 
            return postMobilePhonesAds(req, res, err);
        }
        postMobilePhonesAds(req, res);
    });
}, postMobilePhonesAds);


export default router;