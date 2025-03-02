import express from "express";
const router = express.Router();

//controllers
import { getUserProileDetials } from "../controllers/accountsController.js";

router.get("/myshop", getUserProileDetials);





export default router;