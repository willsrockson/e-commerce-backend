import express from "express";
const router = express.Router();
import { fetchMobilePhones, getEachPhoneById } from "../controllers/dataController.js";



router.get("/phones", fetchMobilePhones );

router.get("/phones/:id", getEachPhoneById)


export default router;