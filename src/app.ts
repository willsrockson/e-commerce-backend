import express from "express";
import cookieParser from "cookie-parser";
const app = express();
import cors from "cors"
const PORT = process.env.PORT || 5001;

// General routes imports
import userRoute from "./routes/usersRoute";
import accountRoute from "./routes/accountRoute";
import newPostAndTrendRoute from "./routes/newPost&TrendRoute"
import idVerificationRoute from "./routes/idVerificationRoute"
//import countAdsRoute from "./routes/countAdsRoute.js"
//import searchRoute from "./routes/searchRoute.js"
import locationTownRoute from "./routes/contents/locationTownRoute";
import contentMobilePhonesRoute from "./routes/contents/electronics/mobilePhonesRoute"

//Categories electronics imports
import mobilePhonesRoute from "./routes/categories/electronics/mobilePhonesRoute"

//Posting of ads route imports
import postMobilePhonesAdRoute from "./routes/postAds/electronics/postMobilePhonesAdRoute";

//ADMIN
//import verificationRoute from "./routes/ADMIN/verificationRoute.js"
//import authController from "./routes/ADMIN/authRoute.js"


// Makes sure anyone visting the backend uses HTTPS
// app.use((req, res, next) => {
//   if (req.headers["x-forwarded-proto"] !== "https") {
//     return res.redirect("https://" + req.headers.host + req.url);
//   }
//   next();
// });

app.use(cors({
    origin: ['https://tonmame.store', 'http://localhost:3000'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));


app.use(express.json());
app.use(express.urlencoded({extended: true }));
app.use(cookieParser());

//middleware
import { authorizationMiddleware } from "./middleware/authorizationMiddleware";


//General routes
app.use("/api/user", userRoute);
app.use("/api/account", accountRoute);
app.use("/api/homepage", newPostAndTrendRoute );
app.use("/api/verify/", authorizationMiddleware , idVerificationRoute);
//app.use("/api/search", searchRoute);


//Contents
app.use('/api/content/', locationTownRoute);
app.use('/api/content/', contentMobilePhonesRoute);

//Categories electronics routes
app.use("/api/fetch/", mobilePhonesRoute);

// Posting of ads routes
app.use("/api/upload/categories/electronics", authorizationMiddleware, postMobilePhonesAdRoute);

//Count Routes
//app.use("/api/count-ads", countAdsRoute );

//ADMIN
//app.use('/api/workspace/users', verificationRoute);
//app.use('/api/workspace/users', authController);


app.listen(PORT, ()=>{
    console.log(`Server is running on ${PORT}`);
})
