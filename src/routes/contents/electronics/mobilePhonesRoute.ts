import express from "express";
import { getBrand , getMobileGeneral, getModel} from "../../../controllers/contents/electronics/mobilePhoneController";
const router = express.Router();


router.get('/mobile/brand', getBrand);
router.get('/mobile/general', getMobileGeneral);
router.get('/mobile/model/:brand', getModel);


export default router;