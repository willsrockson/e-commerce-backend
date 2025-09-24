import express,{Request, Response} from "express";
const router = express.Router();
import multer, { FileFilterCallback,  } from "multer";
import { authorizationMiddleware } from "../middleware/authorizationMiddleware";

// File filter to accept only images
const fileFilter = (req: Request, avatar: Express.Multer.File , cb: FileFilterCallback ) => {
  if (avatar.mimetype.startsWith('image/')) {
      cb(null, true); // Accept the file
  } else {
      cb( new Error('Only images are allowed!')); // Reject the file
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
  deactivateAdvertPostedByMe,
  getAllSavedAdsByMe,
  deleteOneSavedAdsByMe,
  deleteAllSavedAdsByMe,
  emailVerification,
  updateUserUnverifiedEmail,
  updateUserVerifiedEmail,
  resendEmailVerificationLink,
  sendVerificationCodeToEmail
} from "../controllers/accountController";


router.get("/settings", authorizationMiddleware, accountSettings);

router.post("/settings", authorizationMiddleware,(req: Request, res: Response)=>{
    upload.single("avatar")(req, res, (err)=>{
      if(err){
        return res.status(401).json({ message: err.message });
      }
      updateAccountSettings(req, res)
    })
   
  },
updateAccountSettings)

router.post("/email/verification", emailVerification);
router.get("/email/resend/verification/link", authorizationMiddleware, resendEmailVerificationLink);
router.patch("/update/email/not/verified", authorizationMiddleware ,updateUserUnverifiedEmail);
router.patch("/update/email/verified", authorizationMiddleware, updateUserVerifiedEmail);
router.get("/email/request/code", authorizationMiddleware, sendVerificationCodeToEmail);


router.patch("/update/password", authorizationMiddleware, updateAccountPassword);

router.delete("/delete", authorizationMiddleware, deleteAccount)

router.get("/me/ads", authorizationMiddleware, getAllAdvertsPostedByMe);

router.delete('/me/delete/ad/:id', authorizationMiddleware, deleteAdvertPostedByMe);

router.get('/me/deactivate/ad/:id', authorizationMiddleware, deactivateAdvertPostedByMe);

router.get("/me/saved/ads", authorizationMiddleware , getAllSavedAdsByMe);

router.delete("/me/delete/one/saved/ad/:id", authorizationMiddleware ,deleteOneSavedAdsByMe)

router.delete("/me/delete/all/saved/ads", authorizationMiddleware, deleteAllSavedAdsByMe)



export default router;
