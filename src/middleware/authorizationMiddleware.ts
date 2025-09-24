import { Request, Response, NextFunction } from "express";
import { JWTPayload, jwtVerify, SignJWT } from "jose";
import db from "../config/db/connection/dbConnection";
import { UserTable } from "../config/db/schema/user.schema";
import { eq } from "drizzle-orm";
import { secret } from "../controllers/usersController";
import myCacheSystem from "../lib/nodeCache";

// Extends Request to be able to add custom obj to the Request body
interface AddCustomID extends JWTPayload{
    user_id?: string;
} 
export interface AuthRequest extends Request {
  userData?: {
    isValidUser: boolean;
    userID: AddCustomID;
  };
}

interface IjWTAddedTypes extends JWTPayload{
        user_id?: string;
        token_version?: number;
}

interface AuthCookies {
  access_token?: string;
}


export const authorizationMiddleware = async(req: AuthRequest, res: Response, next: NextFunction): Promise<void> =>{  

     try {
         const getCookiesFromBrowser: AuthCookies = req.cookies; 
           
        if(!getCookiesFromBrowser.access_token?.trim()){ 
            throw new Error("Unauthorized user");
         }

        const decodedAccessToken = await jwtVerify<IjWTAddedTypes>(getCookiesFromBrowser.access_token, new TextEncoder().encode(`${process.env.JWT_SECRET_KEY}`));
        
        
        
        if(decodedAccessToken.payload.token_version === Number(myCacheSystem.get(`${decodedAccessToken.payload.user_id}`))){
            console.log('Inside cache fast', myCacheSystem.get(`${decodedAccessToken.payload.user_id}`));
            req.userData = { isValidUser: true, userID: decodedAccessToken.payload };
            next();
            return;
        }else if(decodedAccessToken.payload.user_id){
           const setAnotherCache = await db
               .select({ user_id: UserTable.user_id, token_version: UserTable.token_version })
               .from(UserTable)
               .where(eq(UserTable.user_id, decodedAccessToken.payload.user_id));
            
            if(setAnotherCache.length === 0){
                console.error('Inside no user found in DB');  
                res.clearCookie("access_token", {
                      httpOnly: true,
                      secure: process.env.SITE_MODE === "production",
                      sameSite: "lax",
                    });
                res.status(401).json({ isValidUser: false});
                return;  
            }
            if(setAnotherCache[0].token_version !== decodedAccessToken.payload.token_version){
                 console.error('Token number is different'); 
                 res.clearCookie("access_token", {
                      httpOnly: true,
                      secure: process.env.SITE_MODE === "production",
                      sameSite: "lax",
                    });
                 res.status(401).json({ isValidUser: false});
                 return;
                
            }
            myCacheSystem.set(decodedAccessToken.payload.user_id, setAnotherCache[0].token_version, 300);
            console.log('Cache set');
             req.userData = { isValidUser: true, userID: decodedAccessToken.payload };
             next();
             return;
            
        }
           
        
        
     } catch (err) {
        if (err instanceof Error) {
          res.clearCookie("access_token", {
            httpOnly: true,
            secure: process.env.SITE_MODE === "production",
            sameSite: "lax",
          });
          res.status(401).json({ errorMessage: err.message, isValidUser: false });
          return;
         }
     }
       
}