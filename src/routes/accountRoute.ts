import express,{Request, Response} from "express";
const router = express.Router();
import { authorizationMiddleware } from "../middleware/authorizationMiddleware";
import { uploadFilter } from "../lib/multer.filter";
const upload = uploadFilter({fileSize: 5 * 1024 * 1024, numOfFiles: 1})
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
  sendVerificationCodeToEmail,
  removePhoneSecondary,
  sendOtpCode,
  resetPassword,
  updateProfilePicture
} from "../controllers/accountController";

router.get("/settings", authorizationMiddleware, accountSettings);
router.post("/settings", authorizationMiddleware, upload.none(), updateAccountSettings);
router.post("/settings/profile/picture", authorizationMiddleware,(req: Request, res: Response)=>{
    upload.single("avatar")(req, res, (err)=>{
      if(err){
        return res.status(401).json({ message: err.message });
      }
      updateProfilePicture(req, res)
    })
   
  });
router.patch("/settings/remove/phone/secondary", authorizationMiddleware, removePhoneSecondary);
router.post("/email/verification", emailVerification);
router.get("/email/resend/verification/link", authorizationMiddleware, resendEmailVerificationLink);
router.patch("/update/email/not/verified", authorizationMiddleware ,updateUserUnverifiedEmail);
router.patch("/update/email/verified", authorizationMiddleware, updateUserVerifiedEmail);
router.get("/email/request/code", authorizationMiddleware, sendVerificationCodeToEmail);
router.patch("/update/password", authorizationMiddleware, updateAccountPassword);
router.delete("/delete", authorizationMiddleware, deleteAccount);
router.get("/me/ads", authorizationMiddleware, getAllAdvertsPostedByMe);
router.delete('/me/delete/ad/:id', authorizationMiddleware, deleteAdvertPostedByMe);
router.get('/me/deactivate/ad/:id', authorizationMiddleware, deactivateAdvertPostedByMe);
router.get("/me/saved/ads", authorizationMiddleware , getAllSavedAdsByMe);
router.delete("/me/delete/one/saved/ad/:id", authorizationMiddleware ,deleteOneSavedAdsByMe);
router.delete("/me/delete/all/saved/ads", authorizationMiddleware, deleteAllSavedAdsByMe);
router.post("/me/reset/password/send/otp", sendOtpCode);
router.post("/me/reset/password", resetPassword);



export default router;
