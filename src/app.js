import express from "express";
const app = express();
import cors from "cors"
const PORT = process.env.PORT || 5000;


// Routes imports
import signupRoute from "./routes/usersRoute.js";
import  adsRoute from "./routes/adsRoute.js"

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true }));

//Routes
app.use("/api/user", signupRoute);
app.use("/api/ads", adsRoute)



app.listen(PORT, ()=>{
    console.log(`Server is running on ${PORT}`);
    
})
