import { jwtVerify } from "jose";

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const authorizationMiddleware = async(req, res, next)=>{
     const getCookiesFromBrower = req.cookies; // get cookie from the broswer and the name is access_token    
     try {
         
        if(!getCookiesFromBrower.access_token){ // here access_token is the cookies name
            throw new Error("Unauthorized user");
         }
        
         // checks the validity of the token
       const decodedToken = await jwtVerify(getCookiesFromBrower.access_token, new TextEncoder().encode(`${process.env.JWT_SECRET_KEY}`));
  
       if(!decodedToken) throw new Error("Unauthorized user"); // might be useless but it's there bcs of trust issues.
       
       req.userData = { isValidUser: true, userID: decodedToken.payload };
       next();
        
     } catch (err) {
        return res.status(401).json({ error: err.message, isValidUser: false });   
     }
       
}