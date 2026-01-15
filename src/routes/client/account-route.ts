import { Hono } from "hono";
import type { AccountCacheValues, CloudinaryUploader, Payload, UpdateAccountSettings } from "../../types/client/types.js";
import { db } from "../../database/connection.js";
import { AvatarTable, UserTable } from "../../database/schema/client/user-schema.js";
import { and, eq, or, sql } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { APP, CODES, EMAIL_SUBJECTS, ENVIRONMENT, ROLE } from "../../config/constants.js";
import { changePasswordValidator, changeUnverifiedEmailValidator, changeVerifiedEmailValidator, otpCodeValidator, productCardValidator, updateAccountSettingsValidator } from "../../validators/client/account-validator.js";
import { GenerateSixDigitCode, EmailVerificationWithCache, UploadToCloudinary, HashUserId, SignEmailToken, deleteImages } from "../../utils/universal/universal-functions.js";
import { CodeEmailTemplate, VerifyEmailHtml } from "../../utils/universal/html-templates.js";
import clientCache from "../../utils/universal/node-cache.js";
import fileLimitMiddleware from "../../middlewares/body-limit.js";
import cloudinary from "../../utils/universal/cloudinary.js";
import bcrypt from "bcryptjs";
import { EmailClient } from "../../utils/universal/email-client.js";
import { AdsTable, SavedAdTable } from "../../database/schema/client/contents/ads-schema.js";
import { countPublishedAds, mainCategoryCountQuery, publishedAdsQuery, subCategoryCountQuery } from "../../database/queries/client/account/my-ads-queries.js";



const account = new Hono()
/*
  This route is responsible for sending user account information to the frontend.
*/
account.get("/settings", async (c) => {
   const payload: Payload = c.get("jwtPayload");
   if (payload?.role !== ROLE.USER || !payload?.userId) {
      throw new HTTPException(CODES.HTTP.UNAUTHORIZED, { message: "Unauthorized access" });
   }
   const accountSettings = await db
      .select({
         storeName: UserTable.store_name,
         fullName: UserTable.full_name,
         email: UserTable.email,
         phonePrimary: UserTable.phone_primary,
         phoneSecondary: UserTable.phone_secondary,
         emailVerified: UserTable.email_verified,
         idVerified: UserTable.id_verified,
         phonePrimaryVerified: UserTable.phone_primary_verified,
         phoneSecondaryVerified: UserTable.phone_secondary_verified,
         storeAddress: UserTable.store_address,
         avatarId: AvatarTable.avatar_id,
         imageUrl: AvatarTable.image_url,
         updatedAt: AvatarTable.updated_at,
      })
      .from(UserTable)
      .leftJoin(AvatarTable, eq(UserTable.user_id, AvatarTable.user_id))
      .where(eq(UserTable.user_id, payload.userId));

   if (accountSettings?.length === 0) {
      throw new HTTPException(CODES.HTTP.NOT_FOUND, {message: 'Account settings is not available'});
   } 
   return c.json(accountSettings[0], 200);
});



/*
  This route is responsible for updating the users account information.
*/
account.patch('/settings/update', updateAccountSettingsValidator, async (c)=> {
    const payload: Payload = c.get("jwtPayload");
    const { storeAddress, fullName, storeName, phonePrimary, phoneSecondary } = c.req.valid('form'); 

    if (payload?.role !== ROLE.USER || !payload?.userId) {
       throw new HTTPException(CODES.HTTP.UNAUTHORIZED, { message: "Unauthorized access" });
    }

    let dataToUpdate: UpdateAccountSettings = {};

    if (storeName) dataToUpdate.store_name = storeName;
    if (fullName) dataToUpdate.full_name = fullName;
    if (phonePrimary) dataToUpdate.phone_primary = phonePrimary;
    if (phoneSecondary) dataToUpdate.phone_secondary = phoneSecondary;
    if (storeAddress) dataToUpdate.store_address = storeAddress;

    if (phoneSecondary) {
       //check if Secondary phone is the same as secondary
       const phoneChecker = await db
          .select({ userId: UserTable.user_id })
          .from(UserTable)
          .where(or(eq(UserTable.phone_primary, phoneSecondary), eq(UserTable.phone_secondary, phoneSecondary)));

       if (phoneChecker.length > 0 ) {
          throw new HTTPException(CODES.HTTP.CONFLICT, {
             message: "This number already exist. Please use another number.",
          });
       }
       const [{phoneSecondaryVerified}] = await db
          .select({ phoneSecondaryVerified: UserTable.phone_secondary_verified })
          .from(UserTable)
          .where(eq(UserTable.user_id, payload.userId));

        if (phoneSecondaryVerified === 'verified') {
          throw new HTTPException(CODES.HTTP.CONFLICT, {
             message: "Verified number can't be changed directly.",
          });
       }   
    }
    if (phonePrimary) {
       //check if Primary phone is the same as secondary
       const phoneChecker = await db
          .select({ userId: UserTable.user_id })
          .from(UserTable)
          .where(or(eq(UserTable.phone_primary, phonePrimary), eq(UserTable.phone_secondary, phonePrimary)));

       if (phoneChecker.length > 0 ) {
          throw new HTTPException(CODES.HTTP.CONFLICT, {
             message: "This number already exist. Please use another number.",
          });
       }
       const [{phonePrimaryVerified}] = await db
          .select({ phonePrimaryVerified: UserTable.phone_primary_verified })
          .from(UserTable)
          .where(eq(UserTable.user_id, payload.userId));

        if (phonePrimaryVerified === 'verified') {
          throw new HTTPException(CODES.HTTP.CONFLICT, {
             message: "Verified number can't be changed directly.",
          });
       }   
    }

    if (Object.keys(dataToUpdate).length > 0) {
            await db
                .update(UserTable)
                .set(dataToUpdate)
                .where(eq(UserTable.user_id, payload.userId))
                .returning({ user_id: UserTable.user_id });
        } else {
             return c.json({ success: true, message:'Nothing changed.'}, 200);
        }

    return c.json({ success: true, message:'Profile updated successfully.'}, 200);

});





account.post('/generate/otp/code', otpCodeValidator, async (c)=>{
   const payload: Payload = c.get('jwtPayload');
   const { phone } = c.req.valid('json');
   const logger = c.get('logger');

   if (payload?.role !== ROLE.USER || !payload?.userId) {
       throw new HTTPException(CODES.HTTP.UNAUTHORIZED, { message: "Unauthorized access" });
    }
   const code = GenerateSixDigitCode().toString();
   
   const [{ email, firstName }] = await db
      .select({ email: UserTable.email, firstName: UserTable.full_name })
      .from(UserTable)
      .where(eq(UserTable.user_id, payload.userId));

   if (!email || !firstName) {
      throw new HTTPException(CODES.HTTP.UNAUTHORIZED, { message: "Unauthorized access" });
   }   
   const cacheValue = {
       code: code,
       phoneNumber: phone ?? "",
       email: email,
       role: payload.role
   }
   const html = CodeEmailTemplate({
      appName: APP.NAME,
      code: code.toString(),
      expiresInMinutes: 5,
      purposeText: "Use the verification code below to continue.",
      userName: firstName.split(" ")[0] // take the first name

   })
   const emailSent = await EmailVerificationWithCache({
      to: [email],
      subject: EMAIL_SUBJECTS.VERIFICATION_CODE,
      html: html,
      wantCache: true,
      userId: payload.userId,
      cacheValue: cacheValue,
      ttl: 300 // = 5 minutes 
   });


   logger.info(emailSent);
   return c.json({success: true, message: 'OTP Code sent successfully'}, 200)

});





account.get("/resend/email/verification/link", async (c) => {
   const payload: Payload = c.get("jwtPayload");
   const logger = c.get("logger");

   if (payload?.role !== ROLE.USER || !payload?.userId) {
      throw new HTTPException(CODES.HTTP.UNAUTHORIZED, { message: "Unauthorized access" });
   }
   const user = await db
      .select({
         userId: UserTable.user_id,
         email: UserTable.email,
         fullName: UserTable.full_name,
         role: UserTable.role,
      })
      .from(UserTable)
      .where(eq(UserTable.user_id, payload.userId));

   if (user.length === 0) {
      throw new HTTPException(CODES.HTTP.UNAUTHORIZED, { message: "User not found" });
   }
   // Sign email verification link
   const jwtForResendMessages = await SignEmailToken({
      userId: user[0]?.userId,
      role: user[0]?.role,
   });

   const emailVerificationLink =
      process.env.NODE_ENV === ENVIRONMENT.PROD
         ? `${process.env.FRONTEND_PROD_URL}` + `?verify-email=${jwtForResendMessages}`
         : `${process.env.FRONTEND_DEV_URL}` + `?verify-email=${jwtForResendMessages}`;

   const emailId = await EmailClient(
      [user[0].email],
      EMAIL_SUBJECTS.VERIFY_EMAIL,
      VerifyEmailHtml.replace("[Full Name]", user[0].fullName.split(" ")[0]).replaceAll(
         "[Verification Link]",
         emailVerificationLink
      )
   );
   logger.info(`UserId: ${user[0].userId}: requested for another verification link. ${emailId}`);
   return c.json({ success: true, message: "Verification link sent successfully" });  
});





account.patch("/change/unverified/email", changeUnverifiedEmailValidator, async (c) => {
   const payload: Payload = c.get("jwtPayload");
   const { newEmail, confirmEmail } = c.req.valid("json");
   const logger = c.get("logger");

   if (payload?.role !== ROLE.USER || !payload?.userId) {
      throw new HTTPException(CODES.HTTP.UNAUTHORIZED, { message: "Unauthorized access" });
   }

   if (newEmail?.trim() !== confirmEmail?.trim()) {
      throw new HTTPException(CODES.HTTP.UNAUTHORIZED, { message: "Email mismatch." });
   }

   const checkEmail = await db
      .select({
         email: UserTable.email,
         emailVerified: UserTable.email_verified,
      })
      .from(UserTable)
      .where(eq(UserTable.user_id, payload.userId));

   if (checkEmail.length === 0) {
      throw new HTTPException(CODES.HTTP.UNAUTHORIZED, { message: "Unauthorized access" });
   }

   if (checkEmail[0]?.emailVerified === "verified") {
      throw new HTTPException(CODES.HTTP.UNAUTHORIZED, {
         message: "Your email has already been verified. To change it request for an otp code.",
      });
   }

   if (checkEmail[0].email === newEmail) {
      throw new HTTPException(CODES.HTTP.CONFLICT, { message: "Nothing changed." });
   }

   const checkNewEmailExistence = await db
      .select({ email: UserTable.email })
      .from(UserTable)
      .where(eq(UserTable.email, newEmail));

   if (checkNewEmailExistence.length > 0) {
      throw new HTTPException(CODES.HTTP.CONFLICT, { message: "Email already taken." });
   }

   const user = await db
      .update(UserTable)
      .set({ email: newEmail })
      .where(eq(UserTable.user_id, payload.userId))
      .returning({
         email: UserTable.email,
         userId: UserTable.user_id,
         role: UserTable.role,
         fullName: UserTable.full_name,
      });
   if (user.length === 0) {
      throw new HTTPException(CODES.HTTP.BAD_REQUEST, { message: "Updating email failed." });
   }

   // Sign email verification link
   const jwtForResendMessages = await SignEmailToken({
      userId: user[0]?.userId,
      role: user[0]?.role,
   });

   const emailVerificationLink =
      process.env.NODE_ENV === ENVIRONMENT.PROD
         ? `${process.env.FRONTEND_PROD_URL}` + `?verify-email=${jwtForResendMessages}`
         : `${process.env.FRONTEND_DEV_URL}` + `?verify-email=${jwtForResendMessages}`;

   const emailId = await EmailClient(
      [user[0].email],
      EMAIL_SUBJECTS.VERIFY_EMAIL,
      VerifyEmailHtml.replace("[Full Name]", user[0].fullName.split(" ")[0]).replaceAll(
         "[Verification Link]",
         emailVerificationLink
      )
   );
   const data = {
     email: user[0].email
   }

   logger.info(`UserId: ${user[0].userId}: changed their unverified email. New email:${user[0].email} ${emailId}`);
   return c.json({ success: true, message: "Email updated successfully", data }, 200);
});


account.patch("/change/verified/email", changeVerifiedEmailValidator, async (c) => {
   
   const payload: Payload = c.get("jwtPayload");
   const { newEmail, confirmEmail, code } = c.req.valid("json");
   const logger = c.get("logger");
   const cache = clientCache.get(payload.userId) as AccountCacheValues;

   if (payload?.role !== ROLE.USER || !payload?.userId) {
      throw new HTTPException(CODES.HTTP.UNAUTHORIZED, { message: "Unauthorized access" });
   }

   if (newEmail?.trim() !== confirmEmail?.trim()) {
      throw new HTTPException(CODES.HTTP.UNAUTHORIZED, { message: "Email mismatch." });
   }
   const [{ email, emailVerified }] = await db
      .select({
         email: UserTable.email,
         emailVerified: UserTable.email_verified,
      })
      .from(UserTable)
      .where(eq(UserTable.user_id, payload.userId));

      console.log(email, emailVerified);
      
      console.log(clientCache.get(payload.userId));

      console.log(cache.email !== email || cache.code !== code || emailVerified !== "verified");
      
      
   if (cache.email !== email || cache.code !== code || emailVerified !== "verified") {
      throw new HTTPException(CODES.HTTP.UNAUTHORIZED, {
         message: "We couldn't process your request.",
      });
   }

   if (newEmail === email) {
      throw new HTTPException(CODES.HTTP.UNAUTHORIZED, { message: "Nothing changed" });
   }

   const checkNewEmailExistence = await db
      .select({ email: UserTable.email })
      .from(UserTable)
      .where(eq(UserTable.email, newEmail));

   if (checkNewEmailExistence.length > 0) {
      throw new HTTPException(CODES.HTTP.CONFLICT, { message: "Email already taken." });
   }

   const user = await db
      .update(UserTable)
      .set({ email: newEmail, email_verified: "unverified" })
      .where(eq(UserTable.user_id, payload.userId))
      .returning({
         email: UserTable.email,
         userId: UserTable.user_id,
         role: UserTable.role,
         fullName: UserTable.full_name,
      });
   if (user.length === 0) {
      throw new HTTPException(CODES.HTTP.BAD_REQUEST, { message: "Updating email failed." });
   }

   // Sign email verification link
   const jwtForResendMessages = await SignEmailToken({
      userId: user[0]?.userId,
      role: user[0]?.role,
   });

   const emailVerificationLink =
      process.env.NODE_ENV === ENVIRONMENT.PROD
         ? `${process.env.FRONTEND_PROD_URL}` + `?verify-email=${jwtForResendMessages}`
         : `${process.env.FRONTEND_DEV_URL}` + `?verify-email=${jwtForResendMessages}`;

   const emailId = await EmailClient(
      [user[0].email],
      EMAIL_SUBJECTS.VERIFY_EMAIL,
      VerifyEmailHtml.replace("[Full Name]", user[0].fullName.split(" ")[0]).replaceAll(
         "[Verification Link]",
         emailVerificationLink
      )
   );
   const data = {
      email: user[0].email,
   };

   logger.info(
      `UserId: ${user[0].userId}: changed their verified email. New email:${user[0].email} ${emailId}`
   );
   return c.json({ success: true, message: "Email updated successfully", data }, 200);
});




account.patch('/delete/number', otpCodeValidator ,async(c)=>{
   const payload: Payload = c.get('jwtPayload');
   const { phone } = c.req.valid('json');
   const logger = c.get('logger');

   if (payload?.role !== ROLE.USER || !payload?.userId) {
       throw new HTTPException(CODES.HTTP.UNAUTHORIZED, { message: "Unauthorized access" });
    }

    const [{phonePrimary, phoneSecondary, phonePrimaryVerified, phoneSecondaryVerified}] = await db
       .select({ 
          phonePrimary: UserTable.phone_primary, 
          phoneSecondary: UserTable.phone_secondary,
          phonePrimaryVerified: UserTable.phone_primary_verified,
          phoneSecondaryVerified: UserTable.phone_secondary_verified
          })
       .from(UserTable)
       .where(eq(UserTable.user_id, payload.userId));

    if (phonePrimary === phone && phonePrimaryVerified === "unverified") {
       const [{ userId }] = await db
          .update(UserTable)
          .set({ phone_primary: null })
          .where(or(eq(UserTable.user_id, payload.userId)))
          .returning({ userId: UserTable.user_id });
       {
          userId && logger.info(`UserId: ${userId} deleted their number: ${phone}`);
       }
    } else if (phoneSecondary === phone && phoneSecondaryVerified === "unverified") {
       const [{ userId }] = await db
          .update(UserTable)
          .set({ phone_secondary: null })
          .where(or(eq(UserTable.user_id, payload.userId)))
          .returning({ userId: UserTable.user_id });
       {
          userId && logger.info(`UserId: ${userId} deleted their number: ${phone}`);
       }
    } else {
       throw new HTTPException(CODES.HTTP.BAD_REQUEST, { message: "Phone number not found." });
    }   
    
    return c.json({ success: true, message: 'Phone number deleted successfully'}, 200);
})


account.post('/verify/phone/number',otpCodeValidator, async(c)=>{
   const payload: Payload = c.get('jwtPayload');
   const { phone, code } = c.req.valid('json');
   const logger = c.get('logger');
   const cache = clientCache.get(payload.userId) as AccountCacheValues;

   if (payload?.role !== ROLE.USER || !payload?.userId || !code) {
       throw new HTTPException(CODES.HTTP.UNAUTHORIZED, { message: "Unauthorized access" });
    }
   
   if (!cache || !cache.code || !cache.phoneNumber || cache.role !== 'user') {
       throw new HTTPException(CODES.HTTP.UNAUTHORIZED, { message: "Failed to verify OTP Code." });
    }

     const [{phonePrimary, phoneSecondary, phonePrimaryVerified, phoneSecondaryVerified}] = await db
       .select({ 
          phonePrimary: UserTable.phone_primary, 
          phoneSecondary: UserTable.phone_secondary,
          phonePrimaryVerified: UserTable.phone_primary_verified,
          phoneSecondaryVerified: UserTable.phone_secondary_verified
          })
       .from(UserTable)
       .where(eq(UserTable.user_id, payload.userId));
 
     
    if(cache.code === code && cache.phoneNumber === phonePrimary && phonePrimary === phone && phonePrimaryVerified === "unverified"){
       const [{ userId }] = await db
          .update(UserTable)
          .set({ phone_primary_verified: 'verified'  })
          .where(or(eq(UserTable.user_id, payload.userId)))
          .returning({ userId: UserTable.user_id });
       {
          userId && logger.info(`UserId: ${userId} confirmed their primary number: ${phone}`);
       }
    }else if(cache.code === code && cache.phoneNumber === phoneSecondary && phoneSecondary === phone && phoneSecondaryVerified === "unverified"){
       const [{ userId }] = await db
          .update(UserTable)
          .set({ phone_secondary_verified: 'verified'  })
          .where(or(eq(UserTable.user_id, payload.userId)))
          .returning({ userId: UserTable.user_id });
       {
          userId && logger.info(`UserId: ${userId} confirmed their secondary number: ${phone}`);
       }
    }else{
        throw new HTTPException(CODES.HTTP.BAD_REQUEST, { message: "We couldn't verify your number." });
    }

     // Delete cache after verifying user
     clientCache.del(payload.userId);

     return c.json({ success: true, message: 'Phone number verified successfully'}, 200)

})


account.patch("/change/verified/phone/number", otpCodeValidator, async (c) => {
   const payload: Payload = c.get("jwtPayload");
   const { phone, code, oldPhone } = c.req.valid("json");
   const logger = c.get("logger");
   const cache = clientCache.get(payload.userId) as AccountCacheValues;

   if (payload?.role !== ROLE.USER || !payload?.userId || !code || !oldPhone || !phone) {
      throw new HTTPException(CODES.HTTP.UNAUTHORIZED, { message: "Unauthorized access" });
   }

   if (!cache || !cache.code || !cache.phoneNumber || cache.role !== "user") {
      throw new HTTPException(CODES.HTTP.UNAUTHORIZED, { message: "Failed to verify OTP Code." });
   }

   const phoneChecker = await db
      .select({ userId: UserTable.user_id })
      .from(UserTable)
      .where(or(eq(UserTable.phone_primary, phone), eq(UserTable.phone_secondary, phone)));

   if (phoneChecker.length > 0) {
      throw new HTTPException(CODES.HTTP.CONFLICT, {
         message: "This number already exist. Please use another number.",
      });
   }

   const [{phonePrimary, phoneSecondary, phonePrimaryVerified, phoneSecondaryVerified}] = await db
       .select({ 
          phonePrimary: UserTable.phone_primary, 
          phoneSecondary: UserTable.phone_secondary,
          phonePrimaryVerified: UserTable.phone_primary_verified,
          phoneSecondaryVerified: UserTable.phone_secondary_verified
          })
       .from(UserTable)
       .where(eq(UserTable.user_id, payload.userId));
 
     
    if(cache.code === code && cache.phoneNumber === oldPhone && phonePrimary === oldPhone && phonePrimaryVerified === "verified"){
       const [{ userId }] = await db
          .update(UserTable)
          .set({ phone_primary_verified: 'unverified', phone_primary: phone  })
          .where(or(eq(UserTable.user_id, payload.userId)))
          .returning({ userId: UserTable.user_id });
       {
          userId && logger.info(`UserId: ${userId} changed their verified primary number: ${phone}`);
       }
    }else if(cache.code === code && cache.phoneNumber === oldPhone && phoneSecondary === oldPhone && phoneSecondaryVerified === "verified"){
       const [{ userId }] = await db
          .update(UserTable)
          .set({ phone_secondary_verified: 'unverified', phone_secondary: phone  })
          .where(or(eq(UserTable.user_id, payload.userId)))
          .returning({ userId: UserTable.user_id });
       {
          userId && logger.info(`UserId: ${userId} changed their verified secondary number: ${phone}`);
       }
    }else{
        throw new HTTPException(CODES.HTTP.BAD_REQUEST, { message: "We couldn't change your number." });
    }

     // Delete cache after verifying user
     clientCache.del(payload.userId);

     return c.json({ success: true, message: 'Phone number changed successfully'}, 200)
});



account.post("/set/avatar", fileLimitMiddleware, async (c) => {
   const body = await c.req.parseBody();
   const file = body["avatar"];
   const payload: Payload = c.get("jwtPayload");
   const logger = c.get("logger");

   if (payload?.role !== ROLE.USER || !payload?.userId) {
      throw new HTTPException(CODES.HTTP.UNAUTHORIZED, { message: "Unauthorized access" });
   }

   if (file instanceof File) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      try {
         const hashedUserId = HashUserId(payload.userId); //Hashed so that userId can't be traced through image link.
         const result = (await UploadToCloudinary(
            buffer,
            "e-commerce/avatars",
            hashedUserId
         )) as CloudinaryUploader;

         const optimizedImageUrl = cloudinary.url(result.public_id, {
            version: result.version,
            transformation: [
               {
                  width: 500,
                  height: 500,
                  crop: "fill",
                  gravity: "face",
               },
               {
                  quality: "auto",
                  fetch_format: "auto",
               },
            ],
            secure: true,
         });

         if (!optimizedImageUrl) {
            throw new HTTPException(CODES.HTTP.BAD_REQUEST, {
               message: "Failed updating profile picture",
            });
         }

         //Save optimizedURl into DB
         const [{ avatarId, imageUrl }] = await db
            .insert(AvatarTable)
            .values({
               user_id: payload.userId,
               image_url: optimizedImageUrl,
            })
            .onConflictDoUpdate({
               target: AvatarTable.user_id,
               set: {
                  image_url: optimizedImageUrl,
                  updated_at: new Date(),
               },
            })
            .returning({ avatarId: AvatarTable.avatar_id, imageUrl: AvatarTable.image_url });

         if (!avatarId || !imageUrl) {
            throw new HTTPException(CODES.HTTP.BAD_REQUEST, {
               message: "Failed saving profile picture",
            });
         }

         const data = {
            imageUrl: imageUrl,
         };
         logger.info(`UserId:${payload.userId} updated their profile picture`);
         return c.json(
            { success: true, message: "Profile picture updated successfully", data },
            200
         );
      } catch (error) {
         throw error;
      }
   }

   throw new HTTPException(CODES.HTTP.NOT_FOUND, { message: "File not found" });
});



account.patch("/change/password", changePasswordValidator, async (c) => {
   const payload: Payload = c.get("jwtPayload");
   const logger = c.get("logger");
   const { currentPassword, newPassword, confirmPassword } = c.req.valid("json");

   if (payload?.role !== ROLE.USER || !payload?.userId) {
      throw new HTTPException(CODES.HTTP.UNAUTHORIZED, { message: "Unauthorized access" });
   }

   const [{ password }] = await db
      .select({ password: UserTable.password })
      .from(UserTable)
      .where(eq(UserTable.user_id, payload.userId));

   if (!password) {
      throw new HTTPException(CODES.HTTP.UNAUTHORIZED, { message: "Unauthorized access" });
   }
   const isPasswordValid = await bcrypt.compare(currentPassword, password);

   if (!isPasswordValid) {
      throw new HTTPException(CODES.HTTP.UNAUTHORIZED, { message: "Invalid credentials" });
   }

   //Update password
   const salt = await bcrypt.genSalt(Number(process.env.SALT));
   const hash = await bcrypt.hash(newPassword, salt);

   const [{ userId }] = await db
      .update(UserTable)
      .set({ password: hash, updated_at: new Date() })
      .where(eq(UserTable.user_id, payload.userId))
      .returning({ userId: UserTable.user_id });

   if (!userId) {
      throw new HTTPException(CODES.HTTP.UNAUTHORIZED, {
         message: "Updating password failed. Please retry.",
      });
   }
   return c.json({ success: true, message: "Updated successfully" }, 200);
});



/* 
The code below handles fetching all ads listed by the Seller
*/

interface MyAds{
  main_category?: string;
  sub_category?: string;
}
account.get("/my/ads", async(c)=>{
    const page = Number(c.req.query("page")) || 1;
    const limit = Number(c.req.query("limit")) || 20;
    const offset = (page - 1) * limit;

    const query = c.req.query() as MyAds;
    const payload: Payload = c.get("jwtPayload");

   if (payload?.role !== ROLE.USER || !payload?.userId) {
      throw new HTTPException(CODES.HTTP.UNAUTHORIZED, { message: "Unauthorized access" });
   }

    
    function filterBuilder(query: MyAds, wanted: (keyof MyAds)[]){
         const conditions = [];
          if(wanted.includes('main_category') && query.main_category){
              conditions.push(eq( AdsTable.main_category, query.main_category));
          }
          if(wanted.includes('sub_category') && query.sub_category){
              conditions.push(eq( AdsTable.sub_category, query.sub_category));
          }
         
          return conditions.length > 0 ? and(...conditions) : undefined;
    }
     
    try {
          const allFilters = filterBuilder(query, ["main_category", "sub_category"]);
           const mainCategoryFilters = filterBuilder(query, ["main_category"]);

         const [publishedAds,countAllAd, mainCount, subCount] = await Promise.all(
            [
                publishedAdsQuery({userID: payload.userId, limit: limit, offset: offset, filters: allFilters}),
                countPublishedAds({userID: payload.userId, filters: allFilters}),
                mainCategoryCountQuery({userID: payload.userId, filters: mainCategoryFilters}),
                subCategoryCountQuery({userID: payload.userId, main_category: query.main_category, filters: mainCategoryFilters})
            ]
           );

      
      const total = countAllAd[0].ad_count;
      return c.json({
               publishedAds,
               countAds:{
                    main: mainCount,
                    sub: subCount
               },
               total,
               hasMore: offset + publishedAds.length < total,
               page: page
         }, 200);
    } catch {
       return c.json([]);
    }
})



// Delete all Ads posted by me

account.delete("/delete/my/ads/one/:id", async (c) => {
   const payload: Payload = c.get("jwtPayload");
   const logger = c.get("logger");
   const id = c.req.param("id");

   if (payload?.role !== ROLE.USER || !payload?.userId) {
      throw new HTTPException(CODES.HTTP.UNAUTHORIZED, { message: "Unauthorized access" });
   }
   if (!id?.trim()) {
      throw new HTTPException(CODES.HTTP.NOT_FOUND, { message: "Ad not found" });
   }

   const images = await db
      .select({
         images: AdsTable.images,
      })
      .from(AdsTable)
      .where(and(eq(AdsTable.ads_id, id), eq(AdsTable.user_id, payload.userId)));
   
   if (images[0]?.images?.length <= 1) {
      throw new HTTPException(CODES.HTTP.NOT_FOUND, { message: "Images must be 2 or more" });
   }
   const splitted = images[0].images.map((item: string) => item.split(/\/v\d+\//)[1].split("?")[0]);

   const results = await deleteImages(splitted);

   if (results.length === 0) {
      throw new HTTPException(CODES.HTTP.NOT_FOUND, { message: "No image found" });
   }

   const deleteAd = await db
      .delete(AdsTable)
      .where(and(eq(AdsTable.ads_id, id), eq(AdsTable.user_id, payload.userId)))
      .returning({ ads_id: AdsTable.ads_id });

   if (deleteAd.length === 0) {
      throw new HTTPException(CODES.HTTP.NOT_FOUND, { message: "Oops, we couldn't find your Ad." });
   }

   logger.info(
      {
         event: "Ad_deleted",
         userId: payload.userId,
         adId: deleteAd[0].ads_id,
      },
      "User deleted an Ad they listed"
   );

   return c.json({ success: true, message: "Ad deleted successfully" });
});


// Deactivate Ad posted by me
account.get("/deactivate/ad/:id", async (c) => {
   const payload: Payload = c.get("jwtPayload");
   const logger = c.get("logger");
   const id = c.req.param("id");

   if (payload?.role !== ROLE.USER || !payload?.userId) {
      throw new HTTPException(CODES.HTTP.UNAUTHORIZED, { message: "Unauthorized access" });
   }
   if (!id?.trim()) {
      throw new HTTPException(CODES.HTTP.NOT_FOUND, { message: "Ad not found" });
   }

   const ad = await db
      .select({
         status: AdsTable.deactivated,
      })
      .from(AdsTable)
      .where(and(eq(AdsTable.ads_id, id), eq(AdsTable.user_id, payload.userId)));

   if (ad.length === 0) {
      throw new HTTPException(CODES.HTTP.NOT_FOUND,{message: "We couldn't find your Ad"});
   }

   const updateAdStatus = await db
      .update(AdsTable)
      .set({ deactivated: !ad[0].status })
      .where(and(eq(AdsTable.ads_id, id), eq(AdsTable.user_id, payload.userId)))
      .returning({ ads_id: AdsTable.ads_id });

   if (updateAdStatus.length === 0) {
      throw new HTTPException(CODES.HTTP.NOT_FOUND,{message: "Error changing status"});
   }

   logger.info(
      {
         event: "Ad_visibility_status_changed",
         userId: payload.userId,
         adId: updateAdStatus[0].ads_id,
      },
      "User changed their ad visibility"
   );

   return c.json({ success: true, message: "Ad visibility updated." }, 200);
});



account.post("/products/to/bookmark", productCardValidator, async (c) => {
   const payload: Payload = c.get("jwtPayload");
   const { productId } = c.req.valid("json");
   if (payload?.role !== ROLE.USER || !payload?.userId) {
      throw new HTTPException(CODES.HTTP.UNAUTHORIZED, { message: "Unauthorized access" });
   }

   const adInfo = await db
      .select({
         mainSlug: AdsTable.main_slug,
         subSlug: AdsTable.sub_slug,
         slug: AdsTable.slug,
         ownerUserId: AdsTable.user_id,
         title: AdsTable.title,
         phonePrimary: UserTable.phone_primary,
         price: sql<number>`metadata->>'price'`,
         condition: sql<string>`metadata->>'condition'`,
         region: AdsTable.region,
         town: AdsTable.town,
         firstImage: sql<string>`${AdsTable.images}[1]`.as("first_image"),
      })
      .from(AdsTable)
      .innerJoin(UserTable, eq(UserTable.user_id, AdsTable.user_id))
      .where(eq(AdsTable.ads_id, productId));

   if (!adInfo[0].phonePrimary || adInfo.length === 0) {
      throw new HTTPException(CODES.HTTP.NOT_FOUND, { message: "Error adding to bookmark" });
   }
   if(adInfo[0].ownerUserId === payload.userId){
     throw new HTTPException(CODES.HTTP.FORBIDDEN, { message: "You can't bookmark your own ad" });  
   }

   await db
      .insert(SavedAdTable)
      .values({
         main_category: adInfo[0].mainSlug,
         sub_category: adInfo[0].subSlug,
         ads_id: productId,
         slug: adInfo[0].slug,
         owner_user_id: adInfo[0].ownerUserId,
         user_id: payload?.userId,
         title: adInfo[0].title,
         phone_primary: adInfo[0].phonePrimary,
         condition: adInfo[0].condition,
         location: adInfo[0].region + ", " + adInfo[0].town,
         image_url: adInfo[0].firstImage,
         price: adInfo[0].price,
      })
      .onConflictDoNothing({
         target: [SavedAdTable.user_id, SavedAdTable.ads_id],
      });

   return c.json({ success: true, message: "Bookmarked successfully" });
});


account.get("/bookmarks", async (c) => {
   const payload: Payload = c.get("jwtPayload");

   if (payload?.role !== ROLE.USER || !payload?.userId) {
      throw new HTTPException(CODES.HTTP.UNAUTHORIZED, { message: "Unauthorized access" });
   }

   const savedAds = await db
      .select({
         savedId: SavedAdTable.saved_id,
         adsId: SavedAdTable.ads_id,
         slug: SavedAdTable.slug,
         subCategory: SavedAdTable.sub_category,
         title: SavedAdTable.title,
         phonePrimary: SavedAdTable.phone_primary,
         location: SavedAdTable.location,
         condition: SavedAdTable.condition,
         imageUrl: SavedAdTable.image_url,
         price: SavedAdTable.price,
      })
      .from(SavedAdTable)
      .where(eq(SavedAdTable.user_id, payload.userId));

   if (savedAds.length === 0) {
      return c.json([], 200);
   }

   return c.json(savedAds, 200);
});


account.delete("/delete/one/bookmark/:id", async (c) => {
   const payload: Payload = c.get("jwtPayload");
   const logger = c.get("logger");
   const id = c.req.param("id");

   if (payload?.role !== ROLE.USER || !payload?.userId) {
      throw new HTTPException(CODES.HTTP.UNAUTHORIZED, { message: "Unauthorized access" });
   }
   if (!id?.trim()) {
      throw new HTTPException(CODES.HTTP.NOT_FOUND, { message: "We couldn't find the Ad" });
   }

   const remove = await db
      .delete(SavedAdTable)
      .where(and(eq(SavedAdTable.saved_id, id), eq(SavedAdTable.user_id, payload.userId)))
      .returning({ savedId: SavedAdTable.saved_id });

   if (remove.length === 0) {
      throw new HTTPException(CODES.HTTP.NOT_FOUND, { message: "Ad is not available" });
   }

   logger.info(
      {
         event: "bookmark_deleted",
         userId: payload.userId,
         savedId: remove[0].savedId,
      },
      "User deleted a bookmark"
   );
   return c.json({ success: true, message: "Removed successfully" }, 200);
});



account.delete("/delete/all/bookmark", async (c) => {
   const payload: Payload = c.get("jwtPayload");
   const logger = c.get("logger");

   if (payload?.role !== ROLE.USER || !payload?.userId) {
      throw new HTTPException(CODES.HTTP.UNAUTHORIZED, { message: "Unauthorized access" });
   }

   const deleteAll = await db
      .delete(SavedAdTable)
      .where(eq(SavedAdTable.user_id, payload.userId))
      .returning({ userId: SavedAdTable.user_id });

   if (deleteAll.length === 0) {
      throw new HTTPException(CODES.HTTP.NOT_FOUND, { message: "Ad is not available" });
   }

   logger.info(
      {
         event: "bookmark_deleted",
         userId: payload.userId,
      },
      "User deleted all their bookmark"
   );

   return c.json({ success: true, message: "Bookmark cleared successfully" }, 200);
});


export default account;