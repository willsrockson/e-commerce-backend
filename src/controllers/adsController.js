import { log } from "console";
import supabase from "../config/supabaseConn.js";
/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
import * as fs from "fs"
export const postAds = async (req, res)=>{
     try{

        const files = req.files;
        const texts = req.body;

        console.log(texts);
        
         
        // Checks for no file upload and limit
        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No files provided' });
          }
        if (files.length > 7) {
            return res.status(400).json({ error: 'Can`t upload more than 7 images' });
          }
         
          // map through each file upload it and delete the file
        const uploadAdImagePromises = files.map(async(file)=>{
            // Take the file from /uploads, and pass it to supabase
            const fileBuffer = fs.readFileSync(file.path);

            const {data, error} = await supabase.storage
            .from('ecommerce')
            .upload(`uploads/${Date.now()}-${file.originalname}`, fileBuffer, {
                cacheControl: '3600',
                upsert: false
            })
             
            // Responsible for deleting file after uploading
            fs.unlinkSync(file.path);
            
            if(error){
                throw error
            }

            return data
    
        })

        const results = await Promise.all(uploadAdImagePromises);
        
        const getAllUrl = results.map( async (result)=>{
              const { data: Url } = await supabase.storage
              .from('ecommerce')
              .getPublicUrl(result.path);
            
              return Url;
        })
        const uRl = await Promise.all(getAllUrl);

        //res.status(200).json({links: uRl});
        res.status(200).json({message: "Post has been published"});
       


     }catch(err){
         console.log(err);
         
        return res.status(500).json({ error: 'Upload failed' });
     }
    
   
}