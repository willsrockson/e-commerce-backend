import express from "express"
import { NewPosts } from "../controllers/newPost&TrendController";
const router = express();

router.get("/new/posts", NewPosts);

export default router;