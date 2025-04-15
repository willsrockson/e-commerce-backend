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
const upload = multer({ dest: 'uploads/' , fileFilter , limits: { fileSize: 5 * 1024 * 1024, files: 7 }});


import { addToBuyLater, buyLaterStatus, deleteAdsPhotoOneByOne, editMobilePhoneDetails, fetchMobilePhones, getEachPhoneById } from "../controllers/mobilePhonesController.js";

import  { authorizationMiddleware } from "../middleware/authorizationMiddleware.js"


router.get("/phones", fetchMobilePhones );

router.get("/phones/:id", getEachPhoneById);

router.post("/editmobile/:id", authorizationMiddleware, (req, res) => {
    upload.array('adImages', 7)(req, res, (err) => {
        if (err) { 
            return editMobilePhoneDetails(req, res, err);
        }
        editMobilePhoneDetails(req, res);
    });
}, editMobilePhoneDetails);


router.delete("/delete-ads-photo-one-by-one/:id", authorizationMiddleware, deleteAdsPhotoOneByOne)

router.post("/add-to-buy-later/:id", authorizationMiddleware , addToBuyLater)
router.get("/buy-later-status/:id", authorizationMiddleware, buyLaterStatus)

export default router;