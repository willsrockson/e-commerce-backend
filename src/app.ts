import express, { Express } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app: Express = express();
const PORT = process.env.PORT || 5001;

// General routes imports
import userRoute from "./routes/usersRoute";
import accountRoute from "./routes/accountRoute";
import newPostAndTrendRoute from "./routes/newPost&TrendRoute"
import idVerificationRoute from "./routes/idVerificationRoute"
import locationTownRoute from "./routes/contents/locationTownRoute";
import contentMobilePhonesRoute from "./routes/contents/electronics/mobilePhonesRoute"

//Categories electronics imports
import mobilePhonesRoute from "./routes/categories/electronics/mobilePhonesRoute"

//Posting of ads route imports
import postMobilePhonesAdRoute from "./routes/postAds/electronics/postMobilePhonesAdRoute";

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


//Contents
app.use('/api/content/', locationTownRoute);
app.use('/api/content/', contentMobilePhonesRoute);

//Categories electronics routes
app.use("/api/fetch/", mobilePhonesRoute);

// Posting of ads routes
app.use("/api/upload/categories/electronics", authorizationMiddleware, postMobilePhonesAdRoute);

//This is nothing but an api call to Json place holder to keep the server on. 
// If not render will shut it down after 15 minutes of no api call to the backend.
setInterval(async()=>{
   const keepBackendAlive = async()=>{
      fetch('https://jsonplaceholder.typicode.com/todos/1')
      .then(response => response.json())
      .then(_json => console.log('Keep the server alive'))
      .catch((error)=>{console.log(error.message);
      });
   }
   keepBackendAlive();
}, 720000 )


app.listen(PORT, ()=>{
    console.log(`Server is running on ${PORT}`);
})
