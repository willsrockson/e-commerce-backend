import express from "express";
import { getCategories, getLocationAndTown } from "../../controllers/contents/locationTownController";
const router = express.Router();


router.get('/location', getLocationAndTown);
router.get('/categories', getCategories);


export default router;