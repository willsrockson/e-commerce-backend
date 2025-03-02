import express from "express";
const router = express.Router();

import { createUser, getUser, signOutUser } from "../controllers/usersController.js";
import { authorizationMiddleware } from "../middleware/authorizationMiddleware.js";

router.post("/login", getUser );

router.post("/signup", createUser );

router.get("/auth-state", authorizationMiddleware);

router.post("/sign-out", authorizationMiddleware, signOutUser);




export default router;