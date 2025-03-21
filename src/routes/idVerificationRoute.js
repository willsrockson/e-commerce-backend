import express from "express";
import { getUser, postIdVerificationFiles } from "../controllers/idVerificationController.js";
const router = express.Router();
import multer from "multer";
const upload = multer({ dest: "uploads/" });


router.post("/id_verification", upload.array("idImages", 4), postIdVerificationFiles)

router.get("/getUser", getUser )


export default router;