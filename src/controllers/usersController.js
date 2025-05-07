import sql from '../config/dbConn.js';
import bcrypt from "bcryptjs";
import { SignJWT } from "jose"
import "dotenv/config"

const secret = new TextEncoder().encode(`${process.env.JWT_SECRET_KEY}`);

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const recreateSessionForAlreadyLoginUsers = async (req, res)=>{
      const userID = req.userData.userID.user_id; // get the ID of the logged in user
      
     try {
          
          //Fetch user data
            const getUserData = await sql`
            select users.fullname, avatars.imageUrl 
            FROM users
            FULL JOIN avatars ON users.user_id = avatars.user_id
            WHERE users.user_id = ${ userID }
       `
          if(getUserData.length <= 0){
             throw new Error("Error getting user data!");
          }
        
       res.status(200).json({ data: getUserData, isValidUser: true }) 
          
     } catch (err) {
          return res.status(401).json({ isValidUser: false });
     }

}





/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const loginUser = async(req, res) => {
      const data = await req.body;
      
      if(!data.email_phone || !data.password){
            return res.status(400).json({message: "Field cannot be empty"})
        }

      if(data.password.length  < 6){
            return res.status(400).json({message: "Password must be more than 5 characters."})
       }
      
      try {
            const user = await sql `
              select * from users
              where email = ${data.email_phone} OR phone = ${data.email_phone}
            `;
            if(!user[0]){     
              throw new Error("User doesn't exist");               
            }

           const checkPassword = await bcrypt.compare(data.password, user[0].pwd);

           if(!checkPassword) {
              throw new Error("No record match");
           }
           
           
           const jwt = await new SignJWT({ user_id: user[0].user_id })
              .setProtectedHeader({ alg: 'HS256' })
              .setIssuedAt()
              .setIssuer('https://api.tonmame.store') // Update issuer to your actual domain
              .setAudience('https://www.tonmame.store') // Set audience to frontend domain
              .setExpirationTime('7d')
              .sign(secret);

           if(!jwt){
             throw new Error("Something happened retry!");
           }

           //After a successful login, fetch data
           const getUserData = await sql`
                select users.storename, users.fullname, avatars.imageUrl FROM users
                FULL JOIN avatars ON users.user_id = avatars.user_id
                WHERE users.user_id = ${ user[0].user_id }
           `
           if(!getUserData){
            throw new Error("Error getting user data!");
          }
           
          res.cookie('access_token', jwt, {
               httpOnly: true,
               secure: true,
               sameSite: 'lax',
               domain: "tonmame.store",
               maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days expiration
               path: '/',
             });
           
           res.status(200).json({ data: getUserData, isValidUser: true }) 
      
      } catch (e) {
          return res.status(404).json({ message: e.message, isValidUser: false });
      }

}









// Logic for registering user into the database.

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const signUpUser = async(req, res) => {
      const data = await req.body;

      
      if(!data.email || !data.password || !data.storename || !data.fullname || !data.phone){
         return res.status(400).json({message: "Field cannot be empty"});
      }
      if(data.password.length < 6) return res.status(400).json({message: "Password must be more than 5 characters."});
      if(data.phone.length < 10 || isNaN(data.phone)) return res.status(400).json({message: "Phone must be numbers and 10 digits."});
      if(data.phone.length > 10 || isNaN(data.phone)) return res.status(400).json({message: "Phone number cannot be more than 10 digits."}) ;   
           
      

       try {
         //checks whether user already exist
         const checkRegistration = await sql`
               select email, phone from users 
               where email = ${data.email} or phone = ${data.phone}
            `;
         if (checkRegistration[0]) {
           throw new Error("User already exist");
         }

         //Create account
         const salt = await bcrypt.genSalt(Number(process.env.SALT));
         const hash = await bcrypt.hash(data.password, salt);
         const creatUser = await sql`
                 insert into users(email, pwd, storename, fullname, phone)
                 values(${data.email},${hash},${data.storename},${data.fullname},${data.phone})
                 RETURNING user_id   
            `;
         if (creatUser.length === 0) {
           throw new Error("Couldn't login retry!");
         }

         // Generates JWT token after creating an account
         const jwt = await new SignJWT({ user_id: creatUser[0].user_id })
           .setProtectedHeader({ alg: "HS256" })
           .setIssuedAt()
           .setIssuer('https://api.tonmame.store') // Update issuer to your actual domain
           .setAudience('https://www.tonmame.store') // Set audience to frontend domain
           .setExpirationTime("7d")
           .sign(secret);

         if (!jwt) {
           throw new Error("Something happened retry!");
         }
 
         const getUserData = await sql`
               select users.storename, users.fullname, avatars.imageUrl FROM users
               FULL JOIN avatars ON users.user_id = avatars.user_id
               WHERE users.user_id = ${ creatUser[0].user_id }
             `;         

        if(getUserData.length === 0) throw new Error("Sorry, couldn't sign you in!");
         
          res.cookie('access_token', jwt, {
               httpOnly: true,
               secure: true,
               sameSite: 'lax',
               domain: "tonmame.store",
               maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days expiration
               path: '/',
          });
      
          res.status(201).json({ message: "Account created successfully", data: getUserData, isValidUser: true }) 

        } catch (e) {   
            return res.status(409).json({ message: e.message, isValidUser: false });
          }     
}




//Logic for logging the usr out 
/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

//domain: "tonmame.store"
export const signOutUser = async(req, res)=> {
    try {
         res.cookie('access_token',{}, 
            { httpOnly: true, secure: true, maxAge: 0, sameSite: 'lax', domain: "tonmame.store"});        
         res.status(200).json({ isValidUser: false })
    } catch (error) {
         res.status(500).json({errMessage: "Couldn't logout retry"})
    }  
}