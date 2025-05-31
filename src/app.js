import express from "express";
import cookieParser from "cookie-parser";
const app = express();
import cors from "cors"
const PORT = process.env.PORT || 5001;


// General routes imports
import userRoute from "./routes/usersRoute.js";
import accountRoute from "./routes/accountRoute.js";
import newPostAndTrendRoute from "./routes/newPost&TrendRoute.js"
import idVerificationRoute from "./routes/idVerificationRoute.js"
import countAdsRoute from "./routes/countAdsRoute.js"
import searchRoute from "./routes/searchRoute.js"

//Categories electronics imports
import mobilePhonesRoute from "./routes/categories/electronics/mobilePhonesRoute.js"

//Posting of ads route imports
import postMobilePhonesAdRoute from "./routes/postAds/electronics/postMobilePhonesAdRoute.js";

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
    origin: ['https://tonmame.store', 'http://localhost:5173/'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));


app.use(express.json());
app.use(express.urlencoded({extended: true }));
app.use(cookieParser());

//middleware
import { authorizationMiddleware } from "./middleware/authorizationMiddleware.js";



//General routes
app.use("/api/user", userRoute);
app.use("/api/account", authorizationMiddleware, accountRoute);
app.use("/api/homepage", newPostAndTrendRoute );
app.use("/api/verify/", authorizationMiddleware , idVerificationRoute);
app.use("/api/search", searchRoute);

//Categories electronics routes
app.use("/api/mobile", mobilePhonesRoute);

// Posting of ads routes
app.use("/api/upload/categories/electronics", authorizationMiddleware, postMobilePhonesAdRoute);

//Counte Routes
app.use("/api/count-ads", countAdsRoute );

//ADMIN
app.use('/api/workspace/users', verificationRoute);
app.use('/api/workspace/users', authController);




app.listen(PORT, ()=>{
    console.log(`Server is running on ${PORT}`);
    
})
