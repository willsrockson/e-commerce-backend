import express from "express";
const router = express.Router();
import multer from "multer";
const upload = multer({ dest: "uploads/" });

//controllers
import {
  accountSettings,
  deleteAccount,
  getUserProileDetials,
  updateAccountPassword,
  updateAccountSettings,
} from "../controllers/accountsController.js";

router.get("/myshop", getUserProileDetials);

router.get("/settings", accountSettings);

router.post("/settings", upload.single("avatar"), updateAccountSettings);

router.post("/update_password", updateAccountPassword);

router.delete("/delete", deleteAccount)

export default router;
