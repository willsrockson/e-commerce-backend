import express from "express";
import cookieParser from "cookie-parser";
const app = express();
import cors from "cors"
const PORT = process.env.PORT || 5001;


// Routes imports
import userRoute from "./routes/usersRoute.js";
import  adsRoute from "./routes/adsRoute.js";
import accountRoute from "./routes/accountRoute.js";
import dataRoute from "./routes/dataRoute.js"
import newPostAndTrendRoute from "./routes/newPost&TrendRoute.js"
import idVerificationRoute from "./routes/idVerificationRoute.js"

//ADMIN
import verificationRoute from "./routes/ADMIN/verificationRoute.js"
import authController from "./routes/ADMIN/authRoute.js"


app.use(cors({
    origin: ['https://tonmame.netlify.app', 'http://localhost:3000'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({extended: true }));
app.use(cookieParser());

//middleware
import { authorizationMiddleware } from "./middleware/authorizationMiddleware.js";



//Routes
app.use("/api/user", userRoute);
app.use("/api/ads", authorizationMiddleware, adsRoute);
app.use("/api/account", authorizationMiddleware, accountRoute);
app.use("/api/mobile", dataRoute);
app.use("/api/homepage", newPostAndTrendRoute );
app.use("/api/verify/", authorizationMiddleware , idVerificationRoute);

//ADMIN
app.use('/api/workspace/users', verificationRoute);
app.use('/api/workspace/users', authController);


// app.use((err, req, res, next) => {
//     console.error("Global Error Handler:", err.message);
//     res.status(500).json({ success: false, message: "Internal Server Error" });
    
// });


app.listen(PORT, ()=>{
    console.log(`Server is running on ${PORT}`);
    
})
