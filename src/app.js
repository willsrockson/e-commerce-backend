import express from "express";
import cookieParser from "cookie-parser";
const app = express();
import cors from "cors"
const PORT = process.env.PORT || 5000;


// Routes imports
import signupRoute from "./routes/usersRoute.js";
import  adsRoute from "./routes/adsRoute.js";
import accountRoute from "./routes/accountRoute.js";


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
app.use("/api/user", signupRoute);
app.use("/api/ads", adsRoute);
app.use("/api/account", authorizationMiddleware, accountRoute);



app.listen(PORT, ()=>{
    console.log(`Server is running on ${PORT}`);
    
})
