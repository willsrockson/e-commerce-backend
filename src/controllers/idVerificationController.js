import supabase from "../config/supabaseConn.js";

import * as fs from 'fs'

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const getUser = async (req, res) => {
    const userData = req.userData.userID.user_id;

  try {
    const { data, error } = await supabase
      .from("users")
      .select("verificationstatus")
      .eq("user_id", userData)

    if (error) {
        throw error
    }  

    res.status(200).json(data)
  } catch (error) {
     res.status(400).json(null)
  }
};




// The function below takes 4 pictures with two text, and stores them inside supabase storage/DB.

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const postIdVerificationFiles = async (req, res) => {
  const userID = req.userData.userID.user_id;

  const files = req.files;
  const { ghanaCardNo, businessRegNo } = req.body;

  try {
          if(!ghanaCardNo || !businessRegNo){
             return res.status(400).json({error: 'Fields cannot be empty'});
          }
          
          if (!files || files.length < 4) {
            return res.status(400).json({ error: '4 files expected.' });
          }  

           // map through each file upload it and delete the file
        const uploadAdImagePromises = files.map(async(file)=>{
          // Take the file from /uploads, and pass it to supabase
          const fileBuffer = fs.readFileSync(file.path);

          const {data, error} = await supabase.storage
          .from('ecommerce')
          .upload(`verification-center/${userID}/${Date.now()}-${file.originalname}`, fileBuffer, {
              cacheControl: '3600',
              upsert: false
          })
           
          // Responsible for deleting file after uploading
          fs.unlinkSync(file.path);
          
          if (error) {
            console.error("Upload failed for:", file.originalname, error);
            return null; // Skip the failed file instead of crashing everything
        }

          return data
  
      })

      const results = await Promise.all(uploadAdImagePromises);
        
        const getAllUrl = results.map( async (result)=>{
              const { data: Url } = supabase.storage
              .from('ecommerce')
              .getPublicUrl(result.path);
            
              return Url;
        })
        const uRl = await Promise.all(getAllUrl);
       
        const {error: insertingError} = await supabase
            .from('verificationcenter')
            .insert({
                 ghcardno: ghanaCardNo, 
                 businessregno: businessRegNo,
                 govimages : uRl?.map(url => url.publicUrl), 
                 user_id : userID 
            })

            if(insertingError){
              throw insertingError
            }
            
        const { error: updatingError } = await supabase
            .from('users')
            .update({ verificationstatus: 'Processing' })
            .eq('user_id', userID)
        
            if(updatingError){
              throw updatingError
            }   
              

    res.status(200).json({message: "ID submitted successfully"});

  } catch (error) {
    res.status(500).json([]);
  }
};
