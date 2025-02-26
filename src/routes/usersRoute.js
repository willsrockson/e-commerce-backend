import express from "express";
const router = express.Router();

import { createUser, getUser } from "../controllers/usersController.js";

router.post("/login", getUser );

router.post("/signup", createUser );




export default router;