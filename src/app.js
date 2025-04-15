import express from "express";
import cookieParser from "cookie-parser";
const app = express();
import cors from "cors"
const PORT = process.env.PORT || 5001;


// Routes imports
import userRoute from "./routes/usersRoute.js";
import  adsRoute from "./routes/adsRoute.js";
import accountRoute from "./routes/accountRoute.js";
import mobilePhonesRoute from "./routes/mobilePhonesRoute.js"
import newPostAndTrendRoute from "./routes/newPost&TrendRoute.js"
import idVerificationRoute from "./routes/idVerificationRoute.js"
import countAdsRoute from "./routes/countAdsRoute.js"
import searchRoute from "./routes/searchRoute.js"

//ADMIN
import verificationRoute from "./routes/ADMIN/verificationRoute.js"
import authController from "./routes/ADMIN/authRoute.js"


// Makes sure anyone visting the backend uses HTTPS
// app.use((req, res, next) => {
//   if (req.headers["x-forwarded-proto"] !== "https") {
//     return res.redirect("https://" + req.headers.host + req.url);
//   }
//   next();
// });

app.use(cors({
    origin: 'https://tonmame.store',
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
app.use("/api/mobile", mobilePhonesRoute);
app.use("/api/homepage", newPostAndTrendRoute );
app.use("/api/verify/", authorizationMiddleware , idVerificationRoute);
app.use("/api/count-ads", countAdsRoute );
app.use("/api/search", searchRoute);

//ADMIN
app.use('/api/workspace/users', verificationRoute);
app.use('/api/workspace/users', authController);




app.listen(PORT, ()=>{
    console.log(`Server is running on ${PORT}`);
    
})
