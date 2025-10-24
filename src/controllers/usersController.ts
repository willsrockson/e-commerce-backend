import { Request, Response } from 'express';
import db from '../config/db/connection/dbConnection';
import bcrypt from "bcryptjs";
import { SignJWT } from "jose"
import "dotenv/config"
import { eq, or, sql } from "drizzle-orm";
import { UserTable, AvatarTable } from '../config/db/schema/user.schema';
import { emailClient } from '../config/email.sender';
import { verificationEmailHTML } from '../config/html.templates';
import { AuthRequest } from '../middleware/authorizationMiddleware';
import myCacheSystem from '../lib/nodeCache';
import { sendCustomCookies } from '../lib/cookies';
import { ZloginType, ZSignUpType } from '../utils/zod.types';

export const secret = new TextEncoder().encode(`${process.env.JWT_SECRET_KEY}`);

export const recreateSessionForAlreadyLoginUsers = async (req: AuthRequest, res: Response): Promise<void> =>{
     
     try {
         const userID = req.userData?.userID.user_id; // get the ID of the logged in user
         if(!userID){
            throw new Error("User not found")
         }
          
          //Fetch user data
          const getUserData = await db
              .select({
                  full_name: UserTable.full_name,
                  image_url: AvatarTable.image_url
              })
              .from(UserTable)
              .leftJoin(AvatarTable, eq(UserTable.user_id, AvatarTable.user_id))
              .where(eq(UserTable.user_id, userID));
          
          if(getUserData.length === 0){
             throw new Error("Error fetching user data!");
          }
        
      res.status(200).json({ data: getUserData, isValidUser: true });
          
     } catch (error) {
          if(error instanceof Error){
          res.status(401).json({ isValidUser: false });
          return;
          }
     }

}


// Logic for logging the user in.
export const loginUser = async(req: Request, res: Response): Promise<void> => {
      
      try {
           const data = ZloginType.safeParse(req.body)
        
            if(!data.success){
               throw new Error(data.error.issues[0].message)
            }
            

             //checks whether user already exist
            const user = await db
                .select({ user_id: UserTable.user_id, password: UserTable.password, token_version: UserTable.token_version })
                .from(UserTable)
                .where(
                    or(
                        eq(UserTable.email, data.data.emailPhone),
                        eq(UserTable.phone_primary, data.data.emailPhone)
                    )
                );
              
            if(!user[0]){     
              throw new Error("User doesn't exist");               
            }

           const checkPassword = await bcrypt.compare(data.data.password, user[0].password);

           if(!checkPassword) {
              throw new Error("No record match");
           }
           
           const jwtToken = await new SignJWT({ user_id: user[0].user_id, token_version: user[0].token_version })
              .setProtectedHeader({ alg: 'HS256' })
              .setIssuedAt(new Date())
              .setIssuer('https://api.tonmame.store') // Update issuer to your actual domain
              .setAudience('https://tonmame.store') // Set audience to frontend domain
              .setExpirationTime('7d')
              .sign(secret);

           if(!jwtToken){
             throw new Error("Something happened please retry!");
           }
           

           //After a successful login, fetch data
          const getUserData = await db
              .select({
                  storename: UserTable.store_name,
                  fullname: UserTable.full_name,
                  imageUrl: AvatarTable.image_url,
                  updatedAt: AvatarTable.updated_at
              })
              .from(UserTable)
              .leftJoin(AvatarTable, eq(UserTable.user_id, AvatarTable.user_id))
              .where(eq(UserTable.user_id, user[0].user_id));

           if(!getUserData || getUserData.length === 0){
            throw new Error("Error fetching user data!");
          }
           
         await sendCustomCookies({
            name: 'access_token',
            res: res,
            jwt: jwtToken
          })  
           
          res.status(200).json({ data: getUserData[0], isValidUser: true }) 
      
      } catch (err: unknown) {       
          if(err instanceof Error){
            console.log(err);
            res.status(404).json({ errorMessage: err.message, isValidUser: false });
            return
          }
      }

}



// Logic for registering user into the database.

export const signUpUser = async(req: Request, res: Response): Promise<void> => {
      const emailSubject = "Verify your Email";
       try {
         
         const data = ZSignUpType.safeParse(req.body);

          if(!data.success){
               throw new Error(data.error.issues[0].message)
            }

         //checks whether user already exist
         const checkUserExistence = await db
             .select({ user_id: UserTable.user_id})
             .from(UserTable)
             .where(
                 or(eq(UserTable.email, data.data.email), eq(UserTable.phone_primary, data.data.phonePrimary))
             );
         
         if (checkUserExistence[0]?.user_id) {
           throw new Error("User already exist");
         }

         //Create account
         const salt = await bcrypt.genSalt(Number(process.env.SALT));
         const hash = await bcrypt.hash(data.data.password, salt);
         //Create user object
         const user: typeof UserTable.$inferInsert = {
              full_name: data.data.fullName,
              email: data.data.email,
              password: hash,
              phone_primary: data.data.phonePrimary
         }

        const createUser = await db
            .insert(UserTable)
            .values(user)
            .returning({
                user_id: UserTable.user_id,
                token_version: UserTable.token_version
            });
           
        if (createUser?.length === 0 || !createUser[0]?.user_id) {
           throw new Error("Failed creating user please retry.");
        }
         // Generates JWT token after creating an account
        const jwtToken = await new SignJWT({ user_id: createUser[0].user_id, token_version: createUser[0].token_version })
           .setProtectedHeader({ alg: "HS256" })
           .setIssuedAt(Date.now())
           .setIssuer('https://api.tonmame.store') // Update issuer to your actual domain
           .setAudience('https://tonmame.store') // Set audience to frontend domain
           .setExpirationTime("7d")
           .sign(secret);

         if (!jwtToken) {
           throw new Error("Something went wrong, please login.");
         }

         const getUserData = await db
              .select({
                  storename: UserTable.store_name,
                  fullname: UserTable.full_name,
                  imageUrl: AvatarTable.image_url,
                  updatedAt: AvatarTable.updated_at
              })
              .from(UserTable)
              .leftJoin(AvatarTable, eq(UserTable.user_id, AvatarTable.user_id))
              .where(eq(UserTable.user_id, createUser[0].user_id));
 
               

        if(getUserData.length === 0 || !getUserData){
          throw new Error("Sorry, we couldn't sign you in!");
        }
         
        //generate a token for email verification
        // for security reasons user_id is changed to id
        const jwtForResendMessages = await new SignJWT({ id: createUser[0].user_id })
           .setProtectedHeader({ alg: "HS256" })
           .setIssuedAt()
           .setIssuer('https://api.tonmame.store') // Update issuer to your actual domain
           .setAudience('https://www.tonmame.store') // Set audience to frontend domain
           .setExpirationTime("15m")
           .sign(secret);
        
           if (!jwtForResendMessages) {
           throw new Error("Something went wrong while sending message.");
         }

        const messageTokenLink = process.env.WEBSITE_URL + `?verify-email=${jwtForResendMessages}`;

        await emailClient(
                 [data.data.email], 
                 emailSubject,
                 verificationEmailHTML.replace("[Full Name]", data.data.fullName.split(' ')[0])
                 .replaceAll("[Verification Link]", messageTokenLink)
          );
        
        await sendCustomCookies({
            name: 'access_token',
            res: res,
            jwt: jwtToken
          })   

         
         
         res.status(201).json({ successMessage: "Account created successfully", data: getUserData[0], isValidUser: true }); 

        } catch (err: unknown) {   
             if(err instanceof Error){
               res.status(409).json({ errorMessage: err.message, isValidUser: false });
               return;
             }
          }     
}


export const signOutUser = async(req: AuthRequest, res: Response): Promise<void> => {
    try {
          const userData = req.userData?.userID.user_id;
          if(!userData){
             throw new Error('User not found');
          }
        
          const updateTokenVersion = await db
              .update(UserTable)
              .set({ token_version: sql`${UserTable.token_version} + 1` })
              .where(eq(UserTable.user_id, userData))
              .returning({user_id: UserTable.user_id});
          
          if(updateTokenVersion.length === 0){
             throw new Error('Logout fail');
          }
         myCacheSystem.del(updateTokenVersion[0].user_id);
         await sendCustomCookies({res: res, name: "access_token", maxAge: 0, jwt: ""})        
         res.status(200).json({ isValidUser: false })
    } catch (error) {
         res.status(500).json({errorMessage: "We couldn’t log you out securely. Please retry."})
         return;
    }  
}