import sql from '../config/dbConn.js';
import bcrypt from "bcryptjs";
import { SignJWT } from "jose"
import "dotenv/config"

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const getUser = async(req, res) => {
      const data = await req.body;

      if(!data.email || !data.password){
            return res.status(400).json({message: "Field cannot be empty"})
        }

      if(data.password.length  < 5){
            return res.status(400).json({message: "Password must be more than 5 characters."})
       }
      
      try {
            const user = await sql `
              select * from users
              where email = ${data.email}
            `
            if(!user[0]){     
              throw new Error("User doesn't exist");               
            }

           const checkPassword = await bcrypt.compare(data.password, user[0].pwd);

           if(!checkPassword) {
              throw new Error("No record match");
           }
           

           const secret = new TextEncoder().encode(process.env.JWT_SECRET_KEY);
           
           const jwt = await new SignJWT({ user_id: 3 })
           .setProtectedHeader({ alg:'HS256' })
           .setIssuedAt()
           .setIssuer('https://api.expressbackend.com')
           .setAudience('tonmame')
           .setExpirationTime('5m')
           .sign(secret)

           if(!jwt){
             throw new Error("Something happened retry!");
           }
           
           res.cookie('access_token', jwt , { httpOnly: false, secure: true, maxAge: 300000, sameSite: 'strict' });
           

          res.status(200).json({isValid: checkPassword, jwt}) 
      
      } catch (e) {
          return res.status(404).json({ message: e.message });
      }

}









// Logic for registering user into the database.

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const createUser = async(req, res) => {
      const data = await req.body;

      if(!data.email || !data.password || !data.firstName || !data.lastName || !data.phone){
         return res.status(400).json({message: "Couldn't register user."});
      }
      if(data.password.length < 5) return res.status(400).json({message: "Password must be more than 5 characters."});
      if(data.phone.length < 10 || isNaN(data.phone)) return res.status(400).json({message: "Phone must be numbers and 10 digits."});
      if(data.phone.length > 10 || isNaN(data.phone)) return res.status(400).json({message: "Phone number cannot be more than 10 digits."}) ;   
           
      

       try {
            //checks whether user already exist
            const checkRegistration = await sql`
               select email,phone from users 
               where email = ${data.email} or phone = ${data.phone}
            `
            if(checkRegistration[0]){
               throw new Error("User already exist");
            }
            
            //Create account
           const salt = await bcrypt.genSalt(Number(process.env.SALT));
           const hash = await bcrypt.hash(data.password, salt); 
           const creatUser = await sql`
                 insert into users(email, pwd, firstName, lastName, phone)
                 values(${data.email},${hash},${data.firstName},${data.lastName},${data.phone})
            
            `
            res.status(201).json({message: "Account created successfully"});

       } catch (e) {   
            return res.status(409).json({ message: e.message })
       }     
}