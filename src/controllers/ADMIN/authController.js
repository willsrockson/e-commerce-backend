import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import "dotenv/config";
import sql from "../../config/dbConn.js";

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const loginAdmin = async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      throw new Error("Fields cannot be empty");
    }
    if (password.length < 8) {
      throw new Error("Password must be at least 8 characters!");
    }

    const user = await sql`
              select * from workspaceusers
              where username = ${username}
            `;
    if (!user[0]) {
      throw new Error("User doesn't exist");
    }

    const checkPassword = await bcrypt.compare(password, user[0].pwd);
    if (!checkPassword) {
      throw new Error("No record match");
    }

    const secret = new TextEncoder().encode(`${process.env.JWT_SECRET_KEY}`);

    const jwt = await new SignJWT({ user_id: user[0].user_id })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setIssuer("https://api-tonmame.onrender.com") // Update issuer to your actual domain
      .setAudience("https://tonmame.netlify.app") // Set audience to frontend domain
      .setExpirationTime("1h")
      .sign(secret);

    if (!jwt) {
      throw new Error("Something happened retry!");
    }

    res.cookie('workspace_token', jwt, {
      httpOnly: true,
      secure: true,
      sameSite: 'none', // Essential for cross-domain cookies
      maxAge: 60 * 60 * 1000, // 1hr days expiration
      path: '/',
    });

    res.status(200).json({message: 'Success'})
  } catch (error) {
    return res.status(401).json({ errorMessage: error.message });
  }
};


// SignUp Admin

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const signupAdmin = async(req, res) => {
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      throw new Error("Fields cannot be empty");
    }
    if (password.length < 8) {
      throw new Error("Password must be at least 8 characters!");
    }

    //checks whether user already exist
    const checkRegistration = await sql`
     select username from workspaceusers 
     where username = ${username}
  `;
    if (checkRegistration[0]) {
      throw new Error("User already exist");
    }

    //Create account
    const salt = await bcrypt.genSalt(Number(process.env.SALT));
    const hash = await bcrypt.hash(password, salt);
    const createWorkspaceUser = await sql`
          insert into workspaceusers( username, pwd )
          values(${username},${hash}) 
     `;
    res.status(201).json({data: createWorkspaceUser,  message: "Account created successfully" });
  } catch (error) {
    return res.status(401).json({ errorMessage: error.message });
  }
};


/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const logoutAdmin = async(req, res) =>{
  res.cookie('workspace_token', " ", { httpOnly: true, secure: true, maxAge: 0, sameSite: 'none' });        
  res.status(200).json({ isValidUser: false }) 
}