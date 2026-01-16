import { Hono } from "hono";
import { emailVerificationValidator, loginValidator, registerValidator } from "../../validators/client/user-validator.js";
import { getCookie, setCookie } from "hono/cookie";
import { verify } from "hono/jwt";
import { db } from "../../database/connection.js";
import { google } from "../../providers/client/auth.js";
import type { GoogleOauthUserData } from "../../types/client/types.js";
import { AvatarTable, UserTable } from "../../database/schema/client/user-schema.js";
import { generateCodeVerifier, generateState } from "arctic";
import { eq, or } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { CODES, ENVIRONMENT, AUTH_JWT_EXPIRY, AUTH_COOKIE_MAX_AGE, EMAIL_SUBJECTS, AUTH_PROVIDER_NAME } from "../../config/constants.js";
import bcrypt from "bcryptjs";
import { SignEmailToken, SignToken } from "../../utils/universal/universal-functions.js";
import { EmailClient } from "../../utils/universal/email-client.js";
import { VerifyEmailHtml } from "../../utils/universal/html-templates.js";

const user = new Hono();

user.post('/login', loginValidator, async (c) => {
    const { emailPhone, password } = c.req.valid('json');
    const logger = c.get('logger');

    const user = await db
       .select({
          userId: UserTable.user_id,
          password: UserTable.password,
          tokenVersion: UserTable.token_version,
          providerName: UserTable.provider_name,
          role: UserTable.role,
       })
       .from(UserTable)
       .where(or(eq(UserTable.email, emailPhone), eq(UserTable.phone_primary, emailPhone), eq(UserTable.phone_secondary, emailPhone)));

    if (user.length === 0 || user[0]?.providerName || !user[0]?.password) {
       throw new HTTPException(CODES.HTTP.NOT_FOUND, { message: "Invalid credentials." });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user[0]?.password);

    if (isPasswordCorrect === false) {
       throw new HTTPException(CODES.HTTP.BAD_REQUEST, { message: "Invalid credentials." });
    }
    // Sign Auth Token
    const jwtToken = await SignToken({
       userId: user[0]?.userId,
       role: user[0]?.role,
       tokenVersion: user[0]?.tokenVersion,
    });

    setCookie(c, "access_token", jwtToken, {
       httpOnly: true,
       secure: process.env.NODE_ENV === ENVIRONMENT.PROD,
       maxAge: AUTH_COOKIE_MAX_AGE, // 24hr minutes
       path: "/",
    });

    logger.info(`${emailPhone}: Logged in successfully.`);

    return c.json({ success: true }, 200);
})



user.post('/signup', registerValidator, async (c) => {
    const { email, fullName, password, phonePrimary } = c.req.valid('json');
    const logger = c.get('logger');

    const checkIfUserExist = await db
             .select({ userId: UserTable.user_id})
             .from(UserTable)
             .where(or(eq(UserTable.email, email), eq(UserTable.phone_primary, phonePrimary), eq(UserTable.phone_secondary, phonePrimary))
             );
         
    if (checkIfUserExist?.length > 0) {
           throw new HTTPException(CODES.HTTP.CONFLICT, { message: 'User already exist.'})
    }
    const salt = await bcrypt.genSalt(Number(process.env.SALT));
    const hash = await bcrypt.hash(password, salt);

    const createUser = await db
       .insert(UserTable)
       .values({
          email: email,
          full_name: fullName,
          password: hash,
          phone_primary: phonePrimary,
       })
       .returning({
          userId: UserTable.user_id,
          role: UserTable.role,
          tokenVersion: UserTable.token_version,
       });

    // Sign Auth Token
    const jwtToken = await SignToken({
       userId: createUser[0]?.userId,
       role: createUser[0]?.role,
       tokenVersion: createUser[0]?.tokenVersion,
    });

    // Sign email verification link
    const jwtForResendMessages = await SignEmailToken({
       userId: createUser[0]?.userId,
       role: createUser[0]?.role,
    });
    
     const emailVerificationLink = process.env.NODE_ENV === ENVIRONMENT.PROD
          ? `${process.env.FRONTEND_PROD_URL}`+`?verify-email=${jwtForResendMessages}`
          : `${process.env.FRONTEND_DEV_URL}`+`?verify-email=${jwtForResendMessages}`;

     const emailId = await EmailClient(
                 [email], 
                 EMAIL_SUBJECTS.VERIFY_EMAIL,
                 VerifyEmailHtml.replace("[Full Name]", fullName.split(' ')[0])
                 .replaceAll("[Verification Link]", emailVerificationLink)
          );     
    
    setCookie(c, "access_token", jwtToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === ENVIRONMENT.PROD,
            maxAge: AUTH_COOKIE_MAX_AGE, // 24hr minutes
            path: "/",
        });

    logger.info(`${email}: registered successfully. ${emailId}`)    
    return c.json({ success: true }, 200);
})


// Login with google
// This route builds the Url for the user login into google.
//
user.get('/oauth/login', async(c)=> {
  //question, why do i need this
  const state = generateState()
  const codeVerifier = generateCodeVerifier();

  // 2. Build the Google URL
  // "scopes" = What do we want? We want their email and profile.
  const scopes = ["openid", "profile", "email"];
  const url = google.createAuthorizationURL(state, codeVerifier, scopes);

  setCookie(c, "google_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === ENVIRONMENT.PROD,
      maxAge: 60 * 10, // 10 minutes
      path: "/",
  });

  setCookie(c, "google_code_verifier", codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === ENVIRONMENT.PROD,
      maxAge: 60 * 10, // 10 minutes
      path: "/",
  });

  // Go to Google and log into your account!
  return c.json({url: url.toString()}, 200);
   
})



// This is where the users information comes
// After logging in, Google sends the user data to this route
//
user.get('/google/callback', async(c)=> {
  // 1. Get the data Google sent us in the URL
  const url = new URL(c.req.url);
  const code = url.searchParams.get("code"); // The "Ticket"
  const state = url.searchParams.get("state");

  // 2. Get the cookies we saved in Route A
  const storedState = getCookie(c, "google_oauth_state");
  const storedCodeVerifier = getCookie(c, "google_code_verifier");

  // 3. SECURITY CHECK: Do the states match?
  // If not, someone is trying to hack the login.
  if (!code || !storedState || !storedCodeVerifier || state !== storedState) {
    throw new HTTPException(CODES.HTTP.BAD_REQUEST, { message: 'Authentication failed'})
  }

  try {
    // 4. THE EXCHANGE: Trade the "Ticket" (code) for the "Wristband" (tokens)
    const tokens = await google.validateAuthorizationCode(code, storedCodeVerifier);
    
    const googleUserResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: {
        Authorization: `Bearer ${tokens.accessToken()}`,
      },
    });
    const googleUser = await googleUserResponse.json() as GoogleOauthUserData;

    if(!googleUser.email || !googleUser.family_name || !googleUser.given_name || !googleUser.sub) {
        throw new HTTPException(CODES.HTTP.NOT_FOUND, {message: 'Unauthorized request'} )
    }

    // ---------------------------------------------------------
    // You now have the user's details 
    // You can proceed to register or log the user in
    // ---------------------------------------------------------

    // Check your Database
     let user;

         user = await db
         .select({ 
             userId: UserTable.user_id, 
             role: UserTable.role ,
             imageUrl: AvatarTable.image_url,
             fullName: UserTable.full_name,
             tokenVersion: UserTable.token_version,
             updatedAt: AvatarTable.updated_at,
            })
         .from(UserTable)
         .leftJoin(AvatarTable, eq(UserTable.user_id, AvatarTable.user_id))
         .where(eq(UserTable.email, googleUser?.email));
    
    // If user doesn't exist -> Insert them into DB.
     let myAppToken;
  
     if (user.length > 0) {
       // Login users 
        myAppToken = await SignToken({
           userId: user[0]?.userId,
           role: user[0]?.role,
           tokenVersion: user[0]?.tokenVersion,
        });

     }else{
       // Create user
        user = await db
           .insert(UserTable)
           .values({
              email: googleUser.email,
              full_name: googleUser.given_name + " " + googleUser.family_name,
              provider_id: googleUser.sub,
              provider_name: AUTH_PROVIDER_NAME.GOOGLE,
           })
           .returning({
              userId: UserTable.user_id,
              role: UserTable.role,
              fullName: UserTable.full_name,
              tokenVersion: UserTable.token_version,
           });
        
        myAppToken = await SignToken({
           userId: user[0]?.userId,
           role: user[0]?.role,
           tokenVersion: user[0]?.tokenVersion,
        });
      
     }

     setCookie(c, "access_token", myAppToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === ENVIRONMENT.PROD, // simple security check
            maxAge: AUTH_COOKIE_MAX_AGE, // 24hr minutes
            path: "/",
        });

    const redirectUrl =
       process.env.NODE_ENV === ENVIRONMENT.PROD
          ? `${process.env.FRONTEND_PROD_URL}`
          : `${process.env.FRONTEND_DEV_URL}`;

    return c.redirect(redirectUrl, 302)

  } catch (error) {
    throw error
  }
})


user.post("/email/verification", emailVerificationValidator, async (c) => {
   const { verifyEmail } = c.req.valid("json");

   if (!verifyEmail) {
      throw new HTTPException(CODES.HTTP.NOT_FOUND, {
         message: "The verification link is invalid or has expired.",
      });
   }
   const payload = await verify(verifyEmail, process.env.EMAIL_JWT_SECRET_KEY!, "HS256") as {
      userId: string;
      role: "user" | "moderator" | "superuser";
   };
   if (!payload) {
      throw new HTTPException(CODES.HTTP.NOT_FOUND, {
         message: "The verification link is invalid or has expired.",
      });
   }
   const user = await db
      .select({
         userId: UserTable.user_id,
         emailVerified: UserTable.email_verified,
      })
      .from(UserTable)
      .where(eq(UserTable.user_id, payload.userId));

   if (user.length === 0) {
      throw new HTTPException(CODES.HTTP.NOT_FOUND, {
         message: "Invalid or expired verification link",
      });
   }

   let message = "";
   switch (user[0].emailVerified) {
      case "unverified":
         const results = await db
            .update(UserTable)
            .set({ email_verified: "verified" })
            .where(eq(UserTable.user_id, user[0].userId))
            .returning({ userId: UserTable.user_id });

         if (results.length === 0) {
            throw new HTTPException(CODES.HTTP.NOT_FOUND, {
               message: "Invalid or expired verification link",
            });
         }
         message = "Your email has been verified.";
         break;
      case "verified":
         message = "Email already verified.";
         break;

      default:
         break;
   }

   return c.json({ success: true, message: message });
});




export default user;