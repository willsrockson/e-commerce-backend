import express from "express";
import { loginAdmin, logoutAdmin, signupAdmin } from "../../controllers/ADMIN/authController.js";
const router = express.Router();

router.post("/login",loginAdmin)
router.post("/signup", signupAdmin)

router.get('/logout', logoutAdmin)


export default router;