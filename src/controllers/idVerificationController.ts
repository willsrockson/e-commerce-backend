import { Request, Response } from "express";
import { AuthRequest } from "../middleware/authorizationMiddleware";
//import supabase from "../config/supabaseConn.js";
import * as fs from 'fs'
import db from "../config/db/connection/dbConnection";
import { eq } from "drizzle-orm";
import { UserTable } from "../config/db/schema/user.schema";

export const getUser = async (req: AuthRequest, res: Response) => {

  try {
    const userID = req.userData?.userID.user_id;
    if(!userID){
      throw new Error('User not found')
    }
    const user = await db.select({id_verification_status: UserTable.id_verification_status})
    .from(UserTable)
    .where(eq(UserTable.user_id, userID));

    if (user.length === 0) {
        throw new Error('No user found')
    }  

    res.status(200).json(user);
  } catch (error) {
     res.status(400).json(null)
  }
};




// The function below takes 4 pictures with two text, and stores them inside supabase storage/DB.


export const postIdVerificationFiles = async (req: AuthRequest, res: Response): Promise<void> => {
  const files = req.files;
  const { ghanaCardNo, dateOfBirth } = req.body;

  console.log(ghanaCardNo, dateOfBirth);
  
  return;

  try {
      //     const userID = req.userData?.userID.user_id;
      //     if(!ghanaCardNo){
      //        res.status(400).json({error: 'Fields cannot be empty'});
      //        return;
      //     }
          
      //     if (!files || files.length < 4) {
      //       res.status(400).json({ error: '4 files expected.' });
      //       return;
      //     }  

      //      // map through each file upload it and delete the file
      //   const uploadAdImagePromises = files.map(async(file)=>{
      //     // Take the file from /uploads, and pass it to supabase
      //     const fileBuffer = fs.readFileSync(file.path);

      //     const {data, error} = await supabase.storage
      //     .from('ecommerce')
      //     .upload(`verification-center/${userID}/${Date.now()}-${file.originalname}`, fileBuffer, {
      //         cacheControl: '3600',
      //         upsert: false
      //     })
           
      //     // Responsible for deleting file after uploading
      //     fs.unlinkSync(file.path);
          
      //     if (error) {
      //       console.error("Upload failed for:", file.originalname, error);
      //       return null; // Skip the failed file instead of crashing everything
      //   }

      //     return data
  
      // })

      // const results = await Promise.all(uploadAdImagePromises);
        
      //   const getAllUrl = results.map( async (result)=>{
      //         const { data: Url } = supabase.storage
      //         .from('ecommerce')
      //         .getPublicUrl(result.path);
            
      //         return Url;
      //   })
      //   const uRl = await Promise.all(getAllUrl);
       
      //   const {error: insertingError} = await supabase
      //       .from('verificationcenter')
      //       .insert({
      //            ghcardno: ghanaCardNo, 
      //            businessregno: businessRegNo,
      //            govimages : uRl?.map(url => url.publicUrl), 
      //            user_id : userID 
      //       })

      //       if(insertingError){
      //         throw insertingError
      //       }
            
      //   const { error: updatingError } = await supabase
      //       .from('users')
      //       .update({ verificationstatus: 'Processing' })
      //       .eq('user_id', userID)
        
      //       if(updatingError){
      //         throw updatingError
      //       }   
              

    res.status(200).json({message: "ID submitted successfully"});

  } catch (error) {
    res.status(500).json([]);
  }
};
