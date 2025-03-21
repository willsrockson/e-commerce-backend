import express from "express";
const router = express.Router();

import { authState, createUser, getUser, recreateSessionForAlreadyLoginUsers, signOutUser } from "../controllers/usersController.js";
import { authorizationMiddleware } from "../middleware/authorizationMiddleware.js";


router.get("/recreate-session", authorizationMiddleware, recreateSessionForAlreadyLoginUsers);

router.post("/login", getUser );

router.post("/signup", createUser );

router.get("/auth-state", authorizationMiddleware, authState);

router.post("/sign-out", authorizationMiddleware, signOutUser);



export default router;