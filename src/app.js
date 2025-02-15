import express from "express";
import cors from "cors"
const PORT = process.env.PORT || 3000;
const app = express();

// Routes imports
import loginRoute from "./routes/loginRoute.js"

app.use(cors());
app.use(express.json());

//Routes
app.use("/api/login", loginRoute);



app.listen(PORT, ()=>{
    console.log(`Server is running on ${PORT}`);
    
})
