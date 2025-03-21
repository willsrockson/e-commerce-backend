import express from "express"
import { NewPosts } from "../controllers/newPost&TrendController.js";
const router = express()



router.get("/newposts", NewPosts);


export default router;