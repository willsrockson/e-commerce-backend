import express from "express";
const router = express.Router();
import multer from "multer";

// File filter to accept only images
const fileFilter = (req, avatar, cb) => {
  if (avatar.mimetype.startsWith('image/')) {
      cb(null, true); // Accept the file
  } else {
      cb( new Error('Only images are allowed!'), false); // Reject the file
  }
};

const upload = multer({ dest: "uploads/", fileFilter , limits: { fileSize: 5 * 1024 * 1024 } });

//controllers
import {
  accountSettings,
  deleteAccount,
  updateAccountPassword,
  updateAccountSettings,
  getAllAdvertsPostedByMe,
  deleteAdvertPostedByMe,
  decactiveAdvertPostedByMe,
  getAllSavedAdsByMe,
  deleteOneSavedAdsByMe,
  deleteAllSavedAdsByMe
} from "../controllers/accountController.js";


router.get("/settings", accountSettings);

//router.post("/settings", upload.single("avatar"), updateAccountSettings);

router.post("/settings", (req, res)=>{
    upload.single("avatar")(req, res, (err)=>{
      if(err){
        return updateAccountSettings(req, res, err)
      }
      updateAccountSettings(req, res)
    })
   
  }, 
updateAccountSettings)

router.post("/update_password", updateAccountPassword);

router.delete("/delete", deleteAccount)

router.get("/me/ads",getAllAdvertsPostedByMe);

router.get('/me/delete/ad/:id', deleteAdvertPostedByMe);

router.get('/me/deactivate/ad/:id', decactiveAdvertPostedByMe);

router.get("/me/saved/ads", getAllSavedAdsByMe);

router.delete("/me/delete/one/saved/ad/:id", deleteOneSavedAdsByMe)

router.delete("/me/delete/all/saved/ads", deleteAllSavedAdsByMe)



export default router;
