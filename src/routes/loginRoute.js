import express from "express";
const router = express.Router();


router.get("/", (req, res)=>{
    res.status(200).json({message: "Login route working"});
})

router.post("/", (req, res)=>{
    res.status(200).json({message: "Posting successful"});
})




export default router;