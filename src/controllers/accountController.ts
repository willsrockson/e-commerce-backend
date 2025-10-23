import { Request, Response } from "express";
import supabase from "../config/db/connection/supabaseStorageConn";
import sharp from "sharp";
import "dotenv/config"
import bcrypt from "bcryptjs";
import { AuthRequest } from "../middleware/authorizationMiddleware.js";
import { 
  countPublishedAds,
  mainCategoryCountQuery,
       publishedAdsQuery,
       subCategoryCountQuery,
       } from "../utils/sql.queries/account/ads-posted-by-me/adsPostedByMe";
import db from "../config/db/connection/dbConnection";
import { AvatarTable, UserTable } from "../config/db/schema/user.schema";
import { and, eq } from "drizzle-orm";
import { jwtVerify, SignJWT } from "jose";
import { secret } from "./usersController";
import { deleteAllFilesAfterUpload } from "../utils/deleteFilesInUploads";
import { hashUserId } from "../utils/crypto.hashing";
import { isValidEmail } from "../lib/email.checker";
import { emailClient } from "../config/email.sender";
import { verificationCodeEmailHTML, verificationEmailHTML } from "../config/html.templates";
import { generateSixDigitCode } from "../lib/number.generator";
import myCacheSystem from "../lib/nodeCache";
import { adsTable, savedAdTable } from "../config/db/schema/ads/ads.schema";


enum EmailVerificationStatus{
    'Not Verified' ='Not Verified',
    'Verified' = 'Verified'
}


export const emailVerification = async(req: Request, res: Response): Promise<void> => {
   
    try {
      const { verify_email } = await req.body;
       if(!verify_email){
        throw new Error("The verification link is invalid or has expired.")
      }
      const { payload } = await jwtVerify<{id?: string}>(verify_email, secret);
      if(!payload.id) return;
      const userVerificationStatus = await db
          .select({
              user_id: UserTable.user_id,
              email_verification_status: UserTable.email_verification_status,
          })
          .from(UserTable)
          .where(eq(UserTable.user_id, payload.id));
       
      if(userVerificationStatus.length === 0){
        res.status(401).json({errorMessage: "Invalid or expired verification link"});
        return;
      }
      
      switch (userVerificationStatus[0].email_verification_status) {
          case EmailVerificationStatus["Not Verified"]:
             const results = await db
                  .update(UserTable)
                  .set({ email_verification_status: EmailVerificationStatus.Verified })
                  .where(eq(UserTable.user_id, userVerificationStatus[0].user_id))
                  .returning({ user_id: UserTable.user_id });
              if(results.length === 0){
                res.status(400).json({ errorMessage: "Invalid or expired verification link." });
                return;
              }    
              res.status(200).json({ successMessage: "Your email has been verified." });   
              break;
          case EmailVerificationStatus.Verified:
              res.status(200).json({ successMessage: "Email already verified." });
              break;

          default:
              break;
      }
           

    } catch (error) {
      if(error instanceof Error){
        console.error(error.message);
        res.status(401).json({errorMessage: "The verification link is invalid or has expired."})
        return
      }
      console.error(String(error));
      res.status(401).json({errorMessage: "The verification link is invalid or has expired."})
      return;
    }
}




export const resendEmailVerificationLink = async(req: AuthRequest, res: Response)=>{
     try {
          const emailSubject = "We’ve resent your verification link";
          const userData = req.userData?.userID.user_id;
          if (!userData) {
            throw new Error("Login to perform this operation.");
        }

        const findUser = await db
            .select({
                user_id: UserTable.user_id,
                email: UserTable.email,
                full_name: UserTable.full_name,
            })
            .from(UserTable)
            .where(eq(UserTable.user_id, userData));
        
        if(findUser.length === 0){
           throw new Error("User not found");
        }    

        const jwtForResendMessages = await new SignJWT({ id: findUser[0]?.user_id })
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setIssuer("https://api.tonmame.store") // Update issuer to your actual domain
            .setAudience("https://www.tonmame.store") // Set audience to frontend domain
            .setExpirationTime("15m")
            .sign(secret);

        if (!jwtForResendMessages) {
            throw new Error("Something went wrong while sending message.");
        }

        const messageTokenLink = process.env.WEBSITE_URL as string + `?verify-email=${jwtForResendMessages}`;

        await emailClient(
            [findUser[0].email],
            emailSubject,
            verificationEmailHTML
                .replace("[Full Name]", findUser[0].full_name.split(" ")[0])
                .replaceAll("[Verification Link]", messageTokenLink)
        );

        res.status(200).json({ successMessage: "Verification email sent" });
      
     } catch (error) {
       if (error instanceof Error) {
            res.status(401).json({ errorMessage: error.message });
            return;
        }
        res.status(401).json({ errorMessage: "Oops, something went wrong retry." });
        return;
      
     }
}

//Update Unverified Email By User... Maybe they mistakenly typed a wrong email
export const updateUserUnverifiedEmail = async (req: AuthRequest, res: Response) => {
    try {
        const emailSubject = "Verify your new email address";
        const { newEmail, confirmEmail }: { newEmail: string; confirmEmail: string } = req.body;
        if (
            !newEmail.trim() ||
            !confirmEmail.trim() ||
            isValidEmail(newEmail) === false ||
            isValidEmail(confirmEmail) === false
        ) {
            throw new Error("Please enter a valid email address.");
        }
        if (newEmail.trim() !== confirmEmail.trim()) {
            throw new Error("Email mismatch.");
        }
        const userData = req.userData?.userID.user_id;
        if (!userData) {
            throw new Error("Login to perform this operation.");
        }
        const checkUserVerification = await db
            .select({
                email: UserTable.email,
                email_verification_status: UserTable.email_verification_status,
            })
            .from(UserTable)
            .where(eq(UserTable.user_id, userData));

        if (checkUserVerification.length === 0) {
            throw new Error("Login to perform this operation.");
        }

        if (
            checkUserVerification[0].email_verification_status === EmailVerificationStatus.Verified
        ) {
            throw new Error(
                "Your email has already been verified. To change it request for an otp code."
            );
        }

        if (checkUserVerification[0].email === newEmail) {
            throw new Error("Update rejected, nothing changed.");
        }

        const changeEmail = await db
            .update(UserTable)
            .set({ email: newEmail })
            .where(eq(UserTable.user_id, userData))
            .returning({
                email: UserTable.email,
                user_id: UserTable.user_id,
                full_name: UserTable.full_name,
            });
        if (changeEmail.length === 0) {
            throw new Error("Updating email failed.");
        }

        const jwtForResendMessages = await new SignJWT({ id: changeEmail[0]?.user_id })
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setIssuer("https://api.tonmame.store") // Update issuer to your actual domain
            .setAudience("https://www.tonmame.store") // Set audience to frontend domain
            .setExpirationTime("15m")
            .sign(secret);

        if (!jwtForResendMessages) {
            throw new Error("Something went wrong while sending message.");
        }

        const messageTokenLink = process.env.WEBSITE_URL + `?verify-email=${jwtForResendMessages}`;

        await emailClient(
            [changeEmail[0].email],
            emailSubject,
            verificationEmailHTML
                .replace("[Full Name]", changeEmail[0].full_name.split(" ")[0])
                .replaceAll("[Verification Link]", messageTokenLink)
        );

        res.status(200).json({ successMessage: "Updated successfully" });
    } catch (error) {
        if (error instanceof Error) {
            res.status(401).json({ errorMessage: error.message });
            return;
        }
        res.status(401).json({ errorMessage: "Oops, something went wrong retry." });
        return;
    }
};



export const sendVerificationCodeToEmail = async(req: AuthRequest, res: Response)=>{
  try {
       const emailSubject = "Your verification code";
       const userData = req.userData?.userID.user_id;
        if (!userData) {
            throw new Error("Login to perform this operation.");
        }

       const fetchUserData = await db
            .select({
                email: UserTable.email,
                email_verification_status: UserTable.email_verification_status,
                full_name: UserTable.full_name,
            })
            .from(UserTable)
            .where(eq(UserTable.user_id, userData));
       
      if(fetchUserData.length === 0){
         throw new Error('User not found')
      }
      if(fetchUserData[0].email_verification_status === EmailVerificationStatus["Not Verified"]){
        throw new Error("You're not supposed to be here, get verified first.");
      }
       const generatedCode = generateSixDigitCode();
       myCacheSystem.set(userData, generatedCode, 300);

       await emailClient(
            [fetchUserData[0].email],
            emailSubject,
            verificationCodeEmailHTML
                .replace("[Full Name]", fetchUserData[0].full_name.split(" ")[0])
                .replaceAll("[Verification Code]", generatedCode.toString())
        );

        res.status(200).json({ successMessage: "We’ve sent your verification code" });
    
  } catch (error) {
       if (error instanceof Error) {
            res.status(401).json({ errorMessage: error.message });
            return;
        }
        res.status(401).json({ errorMessage: "Oops, something went wrong retry." });
        return;
  }
}


//Update verified Email By User... Maybe wants to change email
export const updateUserVerifiedEmail = async(req: AuthRequest, res: Response)=>{
  try {
       const emailSubject = "Verify your new email address"; 
       const { newEmail, confirmEmail, code }: {newEmail: string, confirmEmail: string, code: string } = req.body;
        if (
            !newEmail.trim() ||
            !confirmEmail.trim() ||
            isValidEmail(newEmail) === false ||
            isValidEmail(confirmEmail) === false
        ) {
            throw new Error("Please enter a valid email address.");
        }
        if(!code.trim() || code.length > 6 || code.length < 6) throw new Error("Please enter a valid code");
        if (newEmail.trim() !== confirmEmail.trim()) {
            throw new Error("Email mismatch.");
        }
        const userData = req.userData?.userID.user_id;
        if (!userData) {
            throw new Error("Login to perform this operation.");
        }
        const fetchUserData = await db
            .select({
                email: UserTable.email,
                email_verification_status: UserTable.email_verification_status,
            })
            .from(UserTable)
            .where(eq(UserTable.user_id, userData));

        if (fetchUserData.length === 0) {
            throw new Error("Login to perform this operation.");
        }
        if (fetchUserData[0].email === newEmail) {
            throw new Error("Update rejected, nothing changed.");
        }

        if (
            fetchUserData[0].email_verification_status === EmailVerificationStatus.Verified
        ) {
            const getVerificationCodeFromCache = myCacheSystem.get(userData);
            if(!getVerificationCodeFromCache){
              throw new Error('Your verification code has expired. Please request a new one to continue.');
            }
            const updateEmail = await db
                .update(UserTable)
                .set({ email: newEmail, email_verification_status: EmailVerificationStatus["Not Verified"]})
                .where(eq(UserTable.user_id, userData))
                .returning({ email: UserTable.email, user_id: UserTable.user_id, full_name: UserTable.full_name });
            if(updateEmail.length === 0){
               throw new Error("Oops! We couldn’t complete your email update. Please retry in a moment.");
            }

             const jwtForResendMessages = await new SignJWT({ id: updateEmail[0]?.user_id })
                 .setProtectedHeader({ alg: "HS256" })
                 .setIssuedAt()
                 .setIssuer("https://api.tonmame.store") // Update issuer to your actual domain
                 .setAudience("https://www.tonmame.store") // Set audience to frontend domain
                 .setExpirationTime("15m")
                 .sign(secret);

             if (!jwtForResendMessages) {
                 throw new Error("Something went wrong while sending message.");
             }

             const messageTokenLink =
                 process.env.WEBSITE_URL + `?verify-email=${jwtForResendMessages}`;

             await emailClient(
                 [updateEmail[0].email],
                 emailSubject,
                 verificationEmailHTML
                     .replace("[Full Name]", updateEmail[0].full_name.split(" ")[0])
                     .replaceAll("[Verification Link]", messageTokenLink)
             );
            res.status(200).json({successMessage: 'Updated successfully.'})    
            
        }else{
           throw new Error("You're not supposed to be here, get verified first.")
        }
       

  } catch (error) {
      if(error instanceof Error){
        res.status(401).json({errorMessage: error.message})
        return;
      }
      res.status(401).json({errorMessage: "Oops, something went wrong retry."})
      return
    
  }
  
}


// Account settings
export const accountSettings = async (req: AuthRequest , res: Response): Promise<void> => {  
  try {
    const userData = req.userData?.userID.user_id;
    if(!userData){
       console.log('inside settings');
       
       res.status(404).json({ 
          isValidUser: false
       })
       return;
    }
    const fetchData = await db
        .select({
          store_name: UserTable.store_name,
          full_name: UserTable.full_name,
          email: UserTable.email,
          phone_primary: UserTable.phone_primary,
          phone_secondary: UserTable.phone_secondary,
          email_verification_status: UserTable.email_verification_status,
          id_verification_status: UserTable.id_verification_status,
          store_address: UserTable.store_address,
          avatar_id: AvatarTable.avatar_id,
          image_url: AvatarTable.image_url,
          updated_at: AvatarTable.updated_at 
        })
        .from(UserTable)
        .leftJoin(AvatarTable, eq(UserTable.user_id, AvatarTable.user_id))
        .where(eq(UserTable.user_id, userData));

    if(fetchData.length === 0){
       throw new Error("No settings data found");
    }
    res.status(200).json(fetchData);
  } catch (error) {
    if(error instanceof Error){
      console.error("From accountSettings ", error.message)
      res.status(401).json([])
      return;
    }
    console.error("From accountSettings ", String(error));
    res.status(401).json([])
    return
  }
};



//Update Profile information
export const updateAccountSettings = async (req: AuthRequest, res: Response): Promise<void> => {
    let photoUrl;
    try {
        const userID = req.userData?.userID.user_id;

        if (!userID) {
            return;
        }

        const avatarFile = req.file;
        const { store_name, full_name, phone_primary, phone_secondary, store_address } = req.body;

        if (avatarFile) {
            const outputBuffer = await sharp(avatarFile.path)
                .webp({ quality: 80 })
                .rotate()
                .resize(460, 460)
                .toBuffer();

            const hashResult = hashUserId(userID);
            const { error } = await supabase.storage
                .from("ecommerce")
                .update(`avatars/${hashResult}/${hashResult + ".webp"}`, outputBuffer, {
                    upsert: true,
                });
            deleteAllFilesAfterUpload("./uploads");
            if (error) throw error;

            //Get public URL
            const { data } = supabase.storage
                .from("ecommerce")
                .getPublicUrl(`avatars/${hashResult}/${hashResult + ".webp"}`);

            photoUrl = data?.publicUrl;

            const userExistence = await db
                .select({ user_id: AvatarTable.user_id })
                .from(AvatarTable)
                .where(eq(AvatarTable.user_id, userID));

            if (userExistence[0]?.user_id) {
                let getUpdatedAt = await db
                    .update(AvatarTable)
                    .set({ image_url: data.publicUrl, updated_at: new Date() })
                    .where(eq(AvatarTable.user_id, userID))
                    .returning({ updated_at: AvatarTable.updated_at });

                photoUrl = photoUrl + "?v=" + getUpdatedAt[0].updated_at;
            } else {
                await db.insert(AvatarTable).values({ image_url: data.publicUrl, user_id: userID });
            }
        }

        
    let dataToUpdate: {
        store_name?: string;
        full_name?: string;
        phone_primary?: string;
        phone_secondary?: string;
        store_address?: string;
    } = {};

    if (store_name) dataToUpdate.store_name = store_name;
    if (full_name) dataToUpdate.full_name = full_name;
    if (phone_primary) dataToUpdate.phone_primary = phone_primary;
    if (phone_secondary) dataToUpdate.phone_secondary = phone_secondary;
    if (store_address) dataToUpdate.store_address = store_address;

    if (Object.keys(dataToUpdate).length > 0) {
        const updateUserData = await db
            .update(UserTable)
            .set(dataToUpdate)
            .where(eq(UserTable.user_id, userID))
            .returning({ user_id: UserTable.user_id });

        if (!updateUserData || updateUserData.length === 0) {
            throw new Error("Profile update failed");
        }
    } else {
        res.status(200).json({ successMessage: "Nothing changed", publicUrl: photoUrl });
        return;
    }

    res.status(200).json({
        successMessage: "Profile updated successfully",
        publicUrl: photoUrl,
    });
    } catch (error) {
        if (error instanceof Error) {
            console.error("error profile settings: ", error.message);
            res.status(404).json({ errorMessage: error.message });
            return;
        }
        console.log("error profile settings: ", String(error));
        res.status(404).json({ errorMessage: "Sorry something went wrong." });
        return;
    }
};



//Update user password
export const updateAccountPassword = async (req: AuthRequest, res: Response) => {
    try {
        const userID = req.userData?.userID.user_id;
        console.log(userID);
        
        if (!userID) {
            throw new Error("User not found");
        }
        const {
            currentPassword,
            newPassword,
            confirmPassword,
        }: { currentPassword: string; newPassword: string; confirmPassword: string } = req.body;

        if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
            throw new Error("All fields are required");
        }
        if (currentPassword.length < 6 || newPassword.length < 6 || confirmPassword.length < 6) {
            throw new Error("Password must be at least 6 characters");
        }
        if (newPassword !== confirmPassword) {
            throw new Error("Passwords mismatch");
        }

        const user = await db
            .select({ password: UserTable.password })
            .from(UserTable)
            .where(eq(UserTable.user_id, userID));

        if (user.length === 0) {
            throw new Error("User doesn't exist");
        }
        const checkPassword = await bcrypt.compare(currentPassword, user[0].password);

        if (!checkPassword) {
            throw new Error("Invalid credentials");
        }

        //Update password
        const salt = await bcrypt.genSalt(Number(process.env.SALT));
        const hash = await bcrypt.hash(newPassword, salt);

        const updatePassword = await db
            .update(UserTable)
            .set({ password: hash, updated_at: new Date() })
            .where(eq(UserTable.user_id, userID))
            .returning({ user_id: UserTable.user_id });
        if (updatePassword.length === 0) {
            throw new Error("Password update failed. Please try again.");
        }
        res.status(200).json({ successMessage: "Updated successfully" });
    } catch (error) {
        if (error instanceof Error) {
            console.error("Password update function:", error.message); 
            res.status(401).json({ errorMessage: error.message });
            return;
        }
        console.error("Password update function:", String(error)); 
        res.status(401).json({ errorMessage: "Oops, something went wrong retry." });
        return;
    }
};






//Delete Account
export const deleteAccount = async(req: AuthRequest, res: Response) =>{
  
  try {
    const resData: {
        deleteText: string;
        reasonType: string;
        reasonText: string;
    } = req.body;
    
    const userID = req.userData?.userID.user_id;
    if(!userID){
       throw new Error('Unauthorized user');
    };


    console.log(resData);


    // if( resData === "DELETE" ){
      
    //   //Delete Avatar aka profile picture
    //   const { error: deleteAvatarError } = await supabase
    //   .storage
    //   .from('ecommerce')
    //   .remove([`avatars/${userID}/${userID}.jpg`])
       
    //   if(deleteAvatarError) throw deleteAvatarError
      

    //   // Delete all post
    //   const { data, error:listingError } = await supabase
    //     .storage
    //     .from('ecommerce')
    //     .list(`ads-images/${userID}`)

        
    //     if(listingError){
    //       throw listingError
    //     }else if(data.length > 0 ){

    //       const itemToDelete = data.map( (photo: {name: string}) => `ads-images/${userID}/${photo.name}`)        
    //       const { error: deleteError } = await supabase.storage
    //       .from('ecommerce')
    //       .remove(itemToDelete)

    //       if (deleteError) {
    //        throw deleteError
    //       } else {
    //         console.log('successfully!');
    //       }
             
    //     }

        
    //   const response = await supabase
    //   .from('users')
    //   .delete()
    //   .eq('user_id', userID)

    //   if(response.status){
    //     res.cookie('access_token','delete', {
    //       httpOnly: true,
    //       secure: true,
    //       domain: "tonmame.store",
    //       sameSite: 'lax', // Essential for cross-domain cookies
    //       maxAge: 0, // logout
    //       path: '/',
    //     });
    //   }
      
    // }
    
    res.status(200).json({successMessage: "Account deleted successfully"})
    
  } catch (error) {
      if(error instanceof Error){
        console.error(error.message);
        res.status(401).json({errorMessage: error.message})
        return;
      }
      
      
  }
}

interface IMyAdsType{
  main_category?: string;
  sub_category?: string;
}

// Get all Adverts the user has published
export const getAllAdvertsPostedByMe = async(req:AuthRequest, res: Response): Promise<void> =>{
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const userID = req.userData?.userID.user_id;
    const query = req.query as IMyAdsType;

    if(!userID){
      throw new Error('User not found')
    }
    
    function filterBuilder(query: IMyAdsType, wanted: (keyof IMyAdsType)[]){
         const conditions = [];
          if(wanted.includes('main_category') && query.main_category){
              conditions.push(eq( adsTable.main_category, query.main_category));
          }
          if(wanted.includes('sub_category') && query.sub_category){
              conditions.push(eq( adsTable.sub_category, query.sub_category));
          }
         
          return conditions.length > 0 ? and(...conditions) : undefined;
    }
     
    try {
          const allFilters = filterBuilder(req.query, ["main_category", "sub_category"]);
           const mainCategoryFilters = filterBuilder(req.query, ["main_category"]);

         const [publishedAds,countAllAd, mainCount, subCount] = await Promise.all(
            [
                publishedAdsQuery({userID: userID, limit: limit, offset: offset, filters: allFilters}),
                countPublishedAds({userID: userID, filters: allFilters}),
                mainCategoryCountQuery({userID: userID, filters: mainCategoryFilters}),
                subCategoryCountQuery({userID: userID, main_category: query.main_category, filters: mainCategoryFilters})
            ]
           );

      
      const total = countAllAd[0].ad_count;
      res.status(200).json({
               publishedAds,
               countAds:{
                    main: mainCount,
                    sub: subCount
               },
               total,
               hasMore: offset + publishedAds.length < total,
               page: page
         });
    } catch (error) {
      if(error instanceof Error){
        console.error(error.message);
        res.json([]);
        return;
      }
    }
}



//Delete ads published by user
export const deleteAdvertPostedByMe = async (req:AuthRequest, res: Response): Promise<void> => {
  const userID = req.userData?.userID.user_id;
  const { id } = req.params;

  try {
     if (!userID) throw new Error("User not found");
    if (!id){
       throw new Error('Ad id not found')
    };
    
    const images = await db
       .select({
         images: adsTable.images
       })
       .from(adsTable)
       .where(and(eq(adsTable.ads_id, id), eq(adsTable.user_id, userID)));
    
    if (images.length === 0) {
      throw new Error('No images found');
    }    
    const splitted = images[0].images.map((item: string) => item.split("ecommerce/")[1]);

    const { error: deleteError } = await supabase.storage
      .from("ecommerce")
      .remove(splitted);

    if (deleteError) {
      console.log(deleteError);
      throw deleteError;
    }
  
    const deleteAd = await db
    .delete(adsTable)
    .where(and(eq(adsTable.ads_id, id), eq(adsTable.user_id, userID)))
    .returning({ads_id: adsTable.ads_id});

    if (deleteAd.length === 0) {
      throw new Error("Sorry, we couldn't find your Ad");
    }
 
    res.status(200).json({ successMessage: "Deleted successfully" });
  } catch (error) {
    if(error instanceof Error){
      console.error(String(error));
      res.status(500).json({ errorMessage: 'Something happened while deleting your Ad. Retry!' });
      return;
    }
  }
};


//Deactivated ads published by user
export const deactivateAdvertPostedByMe = async (req: AuthRequest, res: Response): Promise<void> => {
  const userID = req.userData?.userID.user_id;
  const { id } = req.params;

  try {
     if (!userID) throw new Error("User not found");
     if (!id){
       throw new Error('Ad not found')
     }
    const ad = await db
      .select({
         status: adsTable.deactivated
      })
      .from(adsTable)
      .where(and(eq(adsTable.ads_id, id), eq(adsTable.user_id, userID)));

    if (ad.length === 0) throw new Error("We couldn't find your Ad");

    const updateAdStatus = await db
      .update(adsTable)
      .set({deactivated: !ad[0].status})
      .where(and(eq(adsTable.ads_id, id), eq(adsTable.user_id, userID)))
      .returning({ads_id: adsTable.ads_id});

    if (updateAdStatus.length === 0) throw new Error("Error Activating post");

    res
      .status(200)
      .json({ successMessage: "Ad visibility updated." });

  } catch (error) {
    if(error instanceof Error){
      console.error(String(error));
      res.status(500).json({ errorMessage: 'Oops! Please try again.' });
      return;
    }
  }
};



// Get all saved Ads by user
export const getAllSavedAdsByMe = async (req:AuthRequest, res: Response): Promise<void> => {
  try {
    const userID = req.userData?.userID.user_id;
    
    if (!userID) throw new Error("User not found");
    
    
    const savedAds = await db
       .select({
           saved_id: savedAdTable.saved_id,
           ads_id: savedAdTable.ads_id,
           subCategory: savedAdTable.sub_category,
           title: savedAdTable.title,
           phonePrimary: savedAdTable.phone_primary,
           location: savedAdTable.location,
           condition: savedAdTable.condition,
           imageUrl: savedAdTable.image_url,
           price: savedAdTable.price
       })
       .from(savedAdTable)
       .where(eq(savedAdTable.user_id, userID));
           
    if (savedAds.length === 0) {
      res.status(200).json([]);
      return;
    }

    res.status(200).json(savedAds);

  } catch (error) {
     if(error instanceof Error){
        console.error(error.message);
        res.status(400).json([]);
        return;
     }
  }
};



// This removes each saved ads on a single click
export const deleteOneSavedAdsByMe = async (req:AuthRequest, res:Response): Promise<void> => {
  try {
    const saved_id = req.params.id;
    const userID = req.userData?.userID.user_id;
    if(!userID){
       throw new Error('User not found');
    }
    const remove = await db
      .delete(savedAdTable)
      .where(and(eq(savedAdTable.saved_id, saved_id), eq(savedAdTable.user_id, userID)))
      .returning({id: savedAdTable.saved_id});
  
    if (remove.length === 0){
      throw new Error("Ad is not available");
    }

    res.status(200).json({ successMessage: "Removed successfully" });

  } catch (error) {
    if(error instanceof Error){
      console.error(String(error))
      res.status(400).json({ errorMessage: "Failed removing saved Ad" });
      return;
    }
  }
};


// Delete all saved ads
export const deleteAllSavedAdsByMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userID = req.userData?.userID.user_id;
    if(!userID){
       throw new Error('User not found');
    }
    const deleteAll = await db
        .delete(savedAdTable)
        .where(eq(savedAdTable.user_id, userID))
        .returning({id: savedAdTable.saved_id});

    if (deleteAll.length === 0){
       throw new Error('Ad is not available');
    }

    res.status(200).json({ successMessage: "Cleared successfully" });
  } catch (error) {
    if(error instanceof Error){
      console.error(String(error))
      res.status(400).json({ errorMessage: "Failed removing all saved Ad" });
      return;
    }
  }
};
