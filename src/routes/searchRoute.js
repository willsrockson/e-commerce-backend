import express from "express";
import { findProduct } from "../controllers/searchController.js";
const router = express.Router();

router.get("/find-product", findProduct)


export default router;