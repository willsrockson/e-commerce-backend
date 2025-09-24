import express from "express";
const router = express.Router();
import { uploadFilter } from "../../../lib/multer.filter";

const upload = uploadFilter({fileSize: 5 * 1024 * 1024, numOfFiles: 7});

import { 
       addToSaveAds, 
       savedAdsStatus, 
       //deleteAdsPhotoOneByOne, 
       editMobilePhoneDetails, 
       fetchMobilePhones, 
       getEachPhoneById,
       countSavedAd,
       //fetchMobilePhoneForEditing 
    } from "../../../controllers/categories/electronics/mobilePhonesController";

import  { authorizationMiddleware } from "../../../middleware/authorizationMiddleware"


router.get("/mobile/phones", fetchMobilePhones );

router.get("/mobile/phones/:id", getEachPhoneById);

//router.get("/mobile/phone/for/editing/:id", authorizationMiddleware, fetchMobilePhoneForEditing)


router.post("/submit/edited/mobile/phone/:id", authorizationMiddleware, (req, res) => {
    upload.array('adImages', 7)(req, res, (err) => {
        if (err) { 
            res.status(400).json({errorMessage: 'Oops! Something went wrong.'}) //editMobilePhoneDetails(req, res, err);
        }
        editMobilePhoneDetails(req, res);
    });
});


// router.delete("/delete-ads-photo-one-by-one/:id", authorizationMiddleware, deleteAdsPhotoOneByOne)

router.post("/mobile/save/ad/:id", authorizationMiddleware , addToSaveAds);
router.get("/mobile/saved/ad/status/:id", authorizationMiddleware, savedAdsStatus);
router.get("/mobile/saved/ad/count/:id", countSavedAd);

export default router;