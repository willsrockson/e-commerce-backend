import sql from "../config/dbConn.js";
import supabase from "../config/supabaseConn.js";
import * as fs from "fs";
import sharp from "sharp";
import bcrypt from "bcryptjs";
import "dotenv/config"


import { 
       publishedAdsQuery,
       mainCategoryCountQuery,
       subCategoryCountQuery 
       } from "../utils/sql-queries/account/ads-posted-by-me/adsPostedByMe.js";


/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const accountSettings = async (req, res) => {
  const userData = req.userData.userID.user_id;

  try {
    const fetchData = await sql`
             SELECT storename, fullname, phone, phone2, verificationstatus, 
             storeaddress, avatar_id, imageurl, avatars.updated_at
             FROM users
             FULL JOIN avatars ON avatars.user_id = users.user_id
             WHERE users.user_id = ${userData}
        `;
    if (!fetchData) throw new Error("No settings data found");
    res.status(200).json(fetchData);
  } catch (error) {
    console.log("From accountSettings", error.message);
    return res.status(401).json([])
  }
};



// Update Profile information

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const updateAccountSettings = async (req, res, err) => {
    let photoUrl;
    const updatedAt = new Date(Date.now()).toISOString();
  try {

    if(err) return res.status(400).json({ message: err.message });

    const userID = req.userData.userID.user_id;
    const avatarFile = req.file;
    const { storename, fullname, phone, phone2, storeaddress } = req.body;
    
    if (avatarFile) {
     
      const outputBuffer = await sharp(avatarFile.path)
        .webp({ quality: 80 })
        .rotate()
        .resize(460, 460)
        .toBuffer();
        
     
        const { error } = await supabase.storage
            .from('ecommerce')
            .update(`avatars/${userID}/${ userID +".webp" }`, outputBuffer, {
                upsert: true
            })
            fs.unlinkSync(avatarFile.path); //Delete fiile after uploading
            if(error) throw error

            //Get public URL
            const { data } = supabase
            .storage
            .from('ecommerce')
            .getPublicUrl(`avatars/${userID}/${ userID +".webp" }`);

             photoUrl = data.publicUrl;

            const checkUserExistence = await sql`
              SELECT user_id 
              FROM avatars
              WHERE user_id = ${userID}
            `
            
            switch (!checkUserExistence[0]){
                case true: 
                    await sql`
                    INSERT INTO avatars(imageurl, user_id)
                    VALUES(${data.publicUrl}, ${userID})
                    ` 
                break;
                case false:           
                  const getSQLdata =  await sql`
                    UPDATE avatars
                    SET imageurl = ${data.publicUrl}, updated_at = ${updatedAt}
                    WHERE user_id = ${userID}
                    RETURNING updated_at
                `
                //get the updated and time stamp and add it to the URL so the lastest image can be shown
                photoUrl = photoUrl + "?v="+getSQLdata[0].updated_at
                
                break;
                default:
                    return res.status(404).json({error: "Coldn't set avatar"})

            }
             
    }

    let dataToUpdate = {}
    if(storename) dataToUpdate.storename = storename
    if(fullname) dataToUpdate.fullname = fullname
    if(phone) dataToUpdate.phone = phone
    if(phone2) dataToUpdate.phone2 = phone2
    if(storeaddress) dataToUpdate.storeaddress = storeaddress  

    if( Object.keys(dataToUpdate).length > 0 ){
         
      const {error:updateError } = await supabase
      .from('users')
      .update(dataToUpdate)
      .eq('user_id', userID)

       if(updateError){
        throw updateError
       }
    }else{
      return res.status(200).json({message: 'Nothing changed', publicUrl: photoUrl })
    }


    res.status(200).json({message: 'Profile updated successfully', publicUrl: photoUrl })


  } catch (error) {
    console.log('error profile settings: ', error.message);
    return res.status(404).json({message: error.message })
    
  }
  
};



// Update user password
/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const updateAccountPassword = async(req, res)=>{
       const userID = req.userData.userID.user_id;
       const { currentPassword, newPassword, confirmPassword } = req.body
       const updatedAt = new Date(Date.now()).toISOString();

      try {
         
          if(!currentPassword || !newPassword || !confirmPassword){
             throw new Error("Field cannot be empty")
          }
          if(currentPassword.length < 6 || newPassword.length < 6 || confirmPassword.length < 6){
             throw new Error("Password must be at least 6 characters")
          }
          if(newPassword !== confirmPassword){
             throw new Error("Passwords don't match")
          }
     

        const user = await sql `
            select pwd from users
            where user_id = ${userID}
          `
         if(!user[0]){
             throw new Error("User doesn't exist")
         }
         const checkPassword = await bcrypt.compare(currentPassword, user[0].pwd);
         
         if(!checkPassword) {
              throw new Error("Invalid credentials");
          }

          //Update password
          const salt = await bcrypt.genSalt(Number(process.env.SALT));
          const hash = await bcrypt.hash(newPassword, salt); 
          const creatUser = await sql`
                UPDATE users
                SET pwd = ${hash}, updated_at = ${updatedAt}
                WHERE user_id = ${userID}             
           `  
           
         res.status(200).json({message: "Updated successfully"})
      
    } catch (error) {
       return res.status(401).json({message: error.message})
    }
}






// Delete Account

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const deleteAccount = async(req, res) =>{
  
  try {
    const userID = req.userData.userID.user_id;
    const  { DELETE } = await req.body

    if( DELETE?.toLowerCase() === "delete" ){
      
      //Delete Avatar aka profile picture
      const { error: deleteAvatarError } = await supabase
      .storage
      .from('ecommerce')
      .remove([`avatars/${userID}/${userID}.jpg`])
       
      if(deleteAvatarError) throw deleteAvatarError
      

      // Delete all post
      const { data, error:listingError } = await supabase
        .storage
        .from('ecommerce')
        .list(`ads-images/${userID}`)

        
        if(listingError){
          throw listingError
        }else if(data.length > 0 ){

          const itemToDelete = data.map(photo => `ads-images/${userID}/${photo.name}`)        
          const { error: deleteError } = await supabase.storage
          .from('ecommerce')
          .remove(itemToDelete)

          if (deleteError) {
           throw deleteError
          } else {
            console.log('successfully!');
          }
             
        }

        
      const response = await supabase
      .from('users')
      .delete()
      .eq('user_id', userID)

      if(response.status){
        res.cookie('access_token','delete', {
          httpOnly: true,
          secure: true,
          domain: "tonmame.store",
          sameSite: 'lax', // Essential for cross-domain cookies
          maxAge: 0, // logout
          path: '/',
        });
      }
      
    }
    
    res.status(200).json({message: "Account deleted successfully"})
    
  } catch (error) {
      console.log("errM: ", error.message);
      res.status(401).json({message: error.message})
      
  }
}


// Get all Adverts the user has published
/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const getAllAdvertsPostedByMe = async(req, res)=>{
    const userID = req.userData.userID.user_id;
     const {main_category, sub_category} = req.query
     
    try {

        const [publishedAds, mainCategoryCount, subCategoryCount] = await Promise.all(
            [
                publishedAdsQuery(userID, main_category, sub_category),
                mainCategoryCountQuery(userID, main_category, sub_category),
                subCategoryCountQuery(userID, main_category, sub_category)
            ]
           );

      
      res.status(200).json({
        publishedAds,
        counts:{
           main: mainCategoryCount,
           sub: subCategoryCount
        }
      })
    } catch (error) {
      console.log(error.message);
      res.json([]);
    }
}



// Delete ads published by user
/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const deleteAdvertPostedByMe = async (req, res) => {
  const { id } = req.params;

  try {
    if (!id) return;

    const { data, error } = await supabase
      .from("ads")
      .select("images")
      .eq("ads_id", id);
    
    if (error) {
      throw error;
    }
    
    const splited = data[0].images.map((item) => item.split("ecommerce/")[1]);

    const { error: deleteError } = await supabase.storage
      .from("ecommerce")
      .remove(splited);

    if (deleteError) {
      throw deleteError;
    }

    const { error: deletePhone } = await supabase
      .from("ads")
      .delete()
      .eq("ads_id", id);

    if (deletePhone) {
      throw deleteError;
    }

    res.status(200).json({ message: "Deleted successfully" });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ errMessage: 'Something went wrong, please retry!' });
  }
};


//Deactivated ads published by user
/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const decactiveAdvertPostedByMe = async (req, res) => {
  const { id } = req.params;

  try {
    if (!id) return;

    const { data, error: findError } = await supabase
      .from("ads")
      .select("deactivated")
      .eq("ads_id", id);

    if (findError) throw findError;
    
    if (data[0].deactivated) {
      const { error: falseError } = await supabase
        .from("ads")
        .update({ deactivated: false })
        .eq("ads_id", id);

      if (falseError) throw error;
    } else if (data[0].deactivated == false) {
      const { error: trueError } = await supabase
        .from("ads")
        .update({ deactivated: true })
        .eq("ads_id", id);

      if (trueError) throw error;
    }

    res
      .status(200)
      .json({ message: "Ad visibility has been successfully updated." });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ errMessage: 'Something went wrong, please retry!' });
  }
};



// Get all saved Ads by user

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const getAllSavedAdsByMe = async (req, res) => {
  try {
    const queries = req.query;
    const userID = req.userData.userID.user_id;

    if (!userID) throw new Error("User not found");

    const savedAds = await sql`
           SELECT
           savedads.saved_ads_id, 
           ads.ads_id, 
           ads.title,
           ads.main_category,
           ads.sub_category, 
           (metadata->>'price') price, 
           ads.images, 
           (metadata->>'condition') condition, 
           ads.region, 
           ads.town, 
           users.phone,
           users.phone2
           FROM savedads
           JOIN ads ON ads.ads_id = savedads.ads_id
           JOIN users ON users.user_id = ads.user_id
           WHERE savedads.user_id = ${userID}
        `;

    if (savedAds.length === 0 || !savedAds) {
      return res.status(200).json([]);
    }

    res.status(200).json(savedAds);

  } catch (error) {
    console.log(error.message);
    res.status(400).json([]);
  }
};



// This removes each saved ads on a single click
/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const deleteOneSavedAdsByMe = async (req, res) => {
  try {
    const saved_ads_id = Number(req.params.id);
    const userID = req.userData.userID.user_id;
    const remove = await sql`
          DELETE FROM savedads
          WHERE saved_ads_id =${saved_ads_id} AND user_id = ${userID}
          RETURNING *
        `;
    if (remove.length === 0)
      return res.status(200).json({ message: "No data found" });

    res.status(200).json({ message: "Removed successfully" });
  } catch (error) {
    return res.status(400).json({ message: "Failed operation, retry!" });
  }
};




// Delete all saved ads
/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const deleteAllSavedAdsByMe = async (req, res) => {
  try {
    const userID = req.userData.userID.user_id;
    const remove = await sql`
          DELETE FROM savedads
          WHERE user_id = ${userID}
          RETURNING *
        `;
    if (remove.length === 0)
      return res.status(200).json({ message: "No data found" });

    res.status(200).json({ message: "Cleared successfully" });
  } catch (error) {
    return res.status(400).json({ message: "Failed operation, retry!" });
  }
};
