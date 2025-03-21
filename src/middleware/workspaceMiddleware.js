import { jwtVerify } from "jose";

export const workspaceAuthMiddleware = async(req, res, next)=>{

    
     const getCookiesFromBrower = req.cookies;  // get cookie from the broswer and the name is access_token    
     try {
         
        if(!getCookiesFromBrower.workspace_token){ // here access_token is the cookies name
            throw new Error("Unauthorized Operation happened");
         }
         
        
         // checks the validity of the token
       const decodedToken = await jwtVerify(getCookiesFromBrower.workspace_token, new TextEncoder().encode(`${process.env.JWT_SECRET_KEY}`));
  
       if(!decodedToken) throw new Error("Unauthorized"); // might be useless but it's there bcs of trust issues.

 
       req.workspaceData = { isValidUser: true, workID: decodedToken.payload };
       next();
        
     } catch (err) {
        return res.status(401).json({ errMessage: err.message, isValidUser: false });   
     }
       
}