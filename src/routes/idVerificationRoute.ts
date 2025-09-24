import express from "express";
import { getUser, postIdVerificationFiles } from "../controllers/idVerificationController";
const router = express.Router();
import multer from "multer";
const upload = multer({ dest: "uploads/" });


router.post("/id/verification", upload.array("idImages", 3), postIdVerificationFiles)

router.get("/getUser", getUser )


export default router;