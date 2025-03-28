import express from "express";
const router = express.Router();
import multer from "multer";

// File filter to accept only images
const fileFilter = (req, adImages, cb) => {
    if (adImages.mimetype.startsWith('image/')) {
        cb(null, true); // Accept the file
    } else {
        cb( new Error('Only images are allowed!'), false); // Reject the file
    }
};

const upload = multer({ dest: 'uploads/' , fileFilter , limits: { fileSize: 5 * 1024 * 1024 }});



import { decactivePost, deleteSinglePost, getAdvertsPostedByUser, postAds } from "../controllers/adsController.js";


//router.post("/upload", upload.array('adImages', 7), postAds);
router.post("/upload", (req, res) => {
    upload.array('adImages', 7)(req, res, (err) => {
        if (err) { 
            return postAds(req, res, err);
        }
        postAds(req, res);
    });
}, postAds);



router.get("/store-ads-only",getAdvertsPostedByUser)

router.get('/delete-post/:id', deleteSinglePost)

router.get('/deactivate-post/:id', decactivePost)





export default router;