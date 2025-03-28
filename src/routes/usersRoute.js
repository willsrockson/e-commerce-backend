import express from "express";
const router = express.Router();

import {loginUser, recreateSessionForAlreadyLoginUsers, signOutUser, signUpUser } from "../controllers/usersController.js";
import { authorizationMiddleware } from "../middleware/authorizationMiddleware.js";


router.get("/recreate-session", authorizationMiddleware, recreateSessionForAlreadyLoginUsers);

router.post("/login", loginUser );

router.post("/signup", signUpUser );

router.get("/sign-out", authorizationMiddleware, signOutUser);



export default router;