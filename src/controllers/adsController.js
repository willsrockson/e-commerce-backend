import supabase from "../config/supabaseConn.js";
import sharp from "sharp";

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
import * as fs from "fs"
export const postAds = async (req, res)=>{
     try{
        const userID = req.userData.userID.user_id; // get the ID of the logged in user
        const files = req.files;
        const adsInformation = req.body;

          
        if(!userID){
            throw new Error("User not found.")
        }
        if(!adsInformation.category){
            throw new Error("Category not found refresh & retry.")
        }
         
        // Checks for no file upload and limit
        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No files provided.' });
          }
        if (files.length > 7) {
            return res.status(400).json({ error: 'Can`t upload more than 7 images.' });
          }
         
          // map through each file upload it and delete the file
        const uploadAdImagePromises = files.map(async(file)=>{

            // Take the file from /uploads, convert it and store it inside supabase storage
            const outputBuffer = await sharp(file.path)
              .webp({ quality: 90 })
              .rotate()
              .resize(1080 , 810)
              .toBuffer();

            const { data, error } = await supabase.storage
            .from('ecommerce')
            .upload(`ads-images/${userID}/${Date.now()}-${file.originalname}`, outputBuffer, {
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
              const { data: Url } = supabase.storage
              .from('ecommerce')
              .getPublicUrl(result.path);
            
              return Url;
        })
        const uRl = await Promise.all(getAllUrl);
        
        // Post for Phones
        if(adsInformation.category === "Mobile Phones"){
            
            
            const {error:uploadError} = await supabase
            .from('mobilephones')
            .insert({
                brand : adsInformation.brand, 
                model : adsInformation.model,
                region: adsInformation.region,
                town: adsInformation.town, 
                color : adsInformation.color, 
                disk_space : adsInformation.internal_storage, 
                ram_size : adsInformation.ram_size, 
                exchange_possible : adsInformation.exchange_possible, 
                price : adsInformation.price, 
                description : adsInformation.description, 
                title : adsInformation.title, 
                images : uRl?.map(url => url.publicUrl), 
                negotiation : adsInformation.negotiable, 
                condition : adsInformation.condition, 
                user_id : userID 
            })

            if(uploadError){
                throw uploadError
            }
            
        }
        
        res.status(200).json({message: "Post has been published"});
       


     }catch(err){
         console.log("From adsController", err.message ); 
         return res.status(500).json({ error: 'Upload failed' });
     }
    
   
}




/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const getAdvertsPostedByUser = async (req, res) => {
    const userID = req.userData.userID.user_id;
    const { categoryvalue } =  req.query

    try {
         
        if(categoryvalue === "Laptops & Computers"){
            
        }

        const {data, error} = await supabase
        .from('mobilephones')
        .select("*")
        .eq("user_id", userID )

        if(error) throw error

        res.status(200).json(data)
        
    } catch (error) {
        console.log(error.message);   
        res.json([])
    }
}


/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const deleteSinglePost = async(req, res) =>{
   
    const { id } = req.params
   
    try {

         if(!id) return

        const { data, error} = await supabase
        .from('mobilephones')
        .select('images')
        .eq('mobile_id', id)

        if(error){
            throw error
        }
        const splited = data[0].images.map( item => item.split("ecommerce/")[1]);

        const {error:deleteError} = await supabase
        .storage
        .from('ecommerce')
        .remove(splited)  
        
        if(deleteError){
            throw deleteError
        }

        const { error: deletePhone } = await supabase
        .from('mobilephones')
        .delete()
        .eq('mobile_id', id)

        if(deletePhone){
            throw deleteError
        }
        
       res.status(200).json({ message: "Deleted successfully" })

    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ errMessage: error.message })
         
         
    }
   

}


/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const decactivePost = async(req, res)=>{
    const { id } = req.params

    try {

        if(!id) return

        const {data, error:findError} = await supabase
        .from('mobilephones')
        .select('deactivated')
        .eq("mobile_id", id)

        if(findError)throw findError
        
        if( data[0].deactivated ){

             const { error:falseError } =await supabase
             .from('mobilephones')
             .update({ deactivated: false })
             .eq('mobile_id', id)
              
             if(falseError) throw error


        }else if( data[0].deactivated == false ){
            const {error:trueError} =await supabase
             .from('mobilephones')
             .update({ deactivated: true })
             .eq('mobile_id', id)
              
             if(trueError) throw error  
        }
        
       res.status(200).json({message: "Successful operation" }) 
        
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ errMessage: error.message })
    }
}