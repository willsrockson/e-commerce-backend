import sql from "../../../config/dbConn.js";
import pool from "../../../config/pgPool.js";
import supabase from "../../../config/supabaseConn.js";
import sharp from "sharp";
import { deleteAllFilesAfterUpload } from "../../../utils/deleteFilesInUploads.js";

import { countMobilePhoneQuery, modelCountQuery, brandCountQuery, regionCountQuery, townCountQuery,
     conditionCountQuery, storageCountQuery , colorCountQuery, sellersCountQuery, getMobilePhonesQuery
   
} 
from "../../../utils/sql-queries/categories/electronics/mobilephonesQueries.js";

const main_category = 'electronics';
const sub_category = 'mobilephones';


// Get phones + Query
/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const fetchMobilePhones = async (req, res) => {
   const page = parseInt(req.query.page) || 1;
   const limit = parseInt(req.query.limit) || 20;
   const offset = (page - 1) * limit;

   const {
      region,
      town,
      brand,
      model,
      condition,
      min_price,
      max_price,
      disk_space,
      color,
      isverifiedseller,
    } = req.query;
   


   
     try {
          
         let query = ` `
         let param = []
         if(brand){
            query += ` AND metadata->>'brand' = $${param.length + 1} `
           param.push(brand)
         }
         if(model){
            query += ` AND metadata->>'model' = $${param.length + 1} `
           param.push(model)
         }
         if(region){
           query += ` AND region = $${param.length + 1} `
           param.push(region)
         }
         if(town){
           query += ` AND town = $${param.length + 1} `
           param.push(town)
         }
         if(condition){
            query += ` AND metadata->>'condition' = $${param.length + 1} `
           param.push(condition)
         }
         if(disk_space){
            query += ` AND metadata->>'disk_space' = $${param.length + 1} `
           param.push(disk_space)
         }
         if(color){
            query += ` AND metadata->>'color' = $${param.length + 1} `
            param.push(color)
         }
         if(isverifiedseller === 'true'){
            query += ` AND users.isverifiedstore = $${param.length + 1} `
            param.push(true)
         }
         if(isverifiedseller === 'false'){
            query += ` AND users.isverifiedstore = $${param.length + 1} `
            param.push(false)
         }
         

          const [getMobilePhones, countMobilePhone, brandCount, modelCount, regionCount, townCount, conditionCount,
                storageCount, colorCount, isverifiedsellerCount] = await Promise.all(
            [
               getMobilePhonesQuery(query, param, limit, offset),
               countMobilePhoneQuery(query, param),
               brandCountQuery(query, param),
               modelCountQuery(query, param),
               regionCountQuery(query, param),
               townCountQuery(query, param),
               conditionCountQuery(query, param),
               storageCountQuery(query, param),
               colorCountQuery(query, param),
               sellersCountQuery(query, param)
            ])

         const total = parseInt(countMobilePhone.rows[0]?.count);
         
         return res.json({
               phones: getMobilePhones.rows,
               counts:{
                    brand: brandCount.rows,
                    model: modelCount.rows,
                    region: regionCount.rows,
                    town: townCount.rows,
                    condition: conditionCount.rows,
                    disk_space: storageCount.rows,
                    color: colorCount.rows,
                    isverifiedseller: isverifiedsellerCount.rows
               },
               total,
               hasMore: offset + getMobilePhones.rows.length < total,
               page: page
         });

      
     } catch (error) {
        console.log(error.message)
        return res.json([])
     }

  
};

// Function below gets each phones clicked on the site

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const getEachPhoneById = async (req, res) => {
  const { id } = req.params;

  try {
    const getPhone = await sql`
            SELECT 
            ads.ads_id, 
            ads.region, 
            ads.town, 
            ads.description, 
            ads.title, 
            ads.images,
            (metadata->>'color') color, 
            (metadata->>'disk_space') disk_space, 
            (metadata->>'ram_size') ram_size, 
            (metadata->>'exchange_possible') exchange_possible,
            (metadata->>'price') price, 
            (metadata->>'brand') brand,
            (metadata->>'model') model,  
            (metadata->>'negotiable') negotiable, 
            (metadata->>'condition') condition, 
            ads.created_at, 
            avatars.imageurl,
            users.storename, users.fullname, users.phone, users.phone2, users.isverifiedstore, users.created_at As user_created_at
            FROM ads
            JOIN users on users.user_id = ads.user_id
            JOIN avatars on avatars.user_id = users.user_id
            WHERE ads.ads_id = ${id} AND ads.main_category = ${main_category} AND ads.sub_category = ${sub_category};
         `;

    const relatedListings = await sql`
          SELECT 
          ads.ads_id, 
          ads.images, 
          ads.title, 
          ads.region,
          ads.town,
          ads.created_at,
          (metadata->>'price') price, 
          (metadata->>'condition') condition,
          users.isverifiedstore
          FROM ads
          JOIN users on users.user_id = ads.user_id
          WHERE ads.ads_id <> ${id} AND ads.main_category = ${main_category} 
          AND ads.sub_category = ${sub_category} AND metadata->>'model' = ${getPhone[0].model}
    `     
    if (!getPhone) {
      throw new Error("Phone not found");
    }
             
    res.status(200).json([getPhone, relatedListings]);
  } catch (error) {
    console.log('getEachPhoneByID:', error.message);
    return res.status(401).json([]);
  }
};





// Get MobilePhone data For editing
/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const fetchMobilePhoneForEditing = async(req, res)=>{
      
      try {
         const { id } = req.params;
         const userID = req.userData.userID.user_id;         

         if(!userID) throw new Error('User not found')

         const phone = await sql`
            SELECT 
            ads.ads_id, 
            ads.region, 
            ads.town, 
            ads.description, 
            ads.title, 
            ads.images,
            (metadata->>'color') color, 
            (metadata->>'disk_space') disk_space, 
            (metadata->>'ram_size') ram_size, 
            (metadata->>'exchange_possible') exchange_possible,
            (metadata->>'price') price, 
            (metadata->>'brand') brand,
            (metadata->>'model') model,  
            (metadata->>'negotiable') negotiable, 
            (metadata->>'condition') condition 
            FROM ads
            WHERE ads.ads_id = ${id} AND ads.main_category = ${main_category} 
            AND ads.sub_category = ${sub_category} AND ads.user_id = ${userID}
         `;
          
          if(!phone || phone.length === 0) throw new Error('Phone not found')

          res.status(200).json(phone);
        
      } catch (error) {
         console.log(error.message);
         res.status(401).json([])
      }
}




/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const editMobilePhoneDetails = async (req, res, err) => {
  const expectedPhotos = 7;

  try {
    const userID = req.userData.userID.user_id;
    const mobile_id = req.params.id;
    const files = req.files;
    const {
      region,
      town,
      brand,
      model,
      color,
      storage,
      ram,
      negotiable,
      condition,
      description,
      title,
      exPossible,
      price,
    } = req.body;


    if (err) throw new Error(err.message);

    // Adding or changing photos logic
    if (files.length > 0) {
      const { data, error } = await supabase
        .from("ads")
        .select("images")
        .match({ ads_id: mobile_id, user_id: userID });

      if (error) throw new Error("Error finding image");

      const numberOfPhotos =
        files.length + data[0].images.length > expectedPhotos;
      if (numberOfPhotos) {
        deleteAllFilesAfterUpload("./uploads");
        throw new Error(`Total uploads can't be more than ${expectedPhotos}`);
      }
      
      // map through each file upload it
      const uploadAdImagePromises = files.map(async (file) => {
        // Take the file from /uploads, convert it and store it inside supabase storage
        const outputBuffer = await sharp(file.path)
          .webp({ quality: 95 })
          .rotate()
          .resize(1080, 810, { fit: "inside" })
          .toBuffer()

        const { data, error: upLoadError } = await supabase.storage
          .from("ecommerce")
          .upload(
            `ads-images/${userID}/${Date.now()}-${file.filename}.webp`,
            outputBuffer,
            {
              cacheControl: "3600",
              upsert: false,
            }
          );

        if (upLoadError) {
          throw upLoadError;
        }

        return data;
      });
      const results = await Promise.all(uploadAdImagePromises);

      const getAllUrl = results.map(async (result) => {
        const { data: Url } = supabase.storage
          .from("ecommerce")
          .getPublicUrl(result.path);

        return Url;
      });
      const uRl = await Promise.all(getAllUrl);

      await sql`
           UPDATE ads 
           SET images = array_cat(images, ${uRl?.map(url => url.publicUrl)}) 
           WHERE ads_id = ${mobile_id} AND user_id = ${userID};

      `
      deleteAllFilesAfterUpload("./uploads");
      
      if(!region &&
        !town &&
        !brand &&
        !model &&
        !color &&
        !storage &&
        !ram &&
        !negotiable &&
        !condition &&
        !description &&
        !title &&
        !exPossible &&
        !price ){
           return res.status(200).json({ message: "Updated successful" });
           
        }  
    } // Files upload ends here
     
    
    // Fetch old metadata from DB
    const { data: metaData } = await supabase
     .from('ads')
     .select('metadata')
     .match({ ads_id: mobile_id, user_id: userID })
     .single(); 

    let dataToUpdate = {}; // It creates an object of all changes made
     if (region) dataToUpdate.region = region;
     if (town) dataToUpdate.town = town;
     if (description) dataToUpdate.description = description;
     if (title) dataToUpdate.title = title;
     if(brand || model || color || storage || ram || negotiable || condition || exPossible || price){
       dataToUpdate.metadata ={
           brand: (brand ? brand : metaData.metadata.brand),
           color: (color ? color : metaData.metadata.color),
           model: (model ? model : metaData.metadata.model),
           price: (price ? price : metaData.metadata.price),
           ram_size: (ram ? ram : metaData.metadata.ram_size),
           condition: (condition ? condition : metaData.metadata.condition),
           disk_space: (storage ? storage : metaData.metadata.disk_space),
           negotiable: (negotiable ? negotiable : metaData.metadata.negotiable),
           exchange_possible: (exPossible ? exPossible : metaData.metadata.exchange_possible)
       }
     }
    
    // Only update when changes has been made
    if (Object.keys(dataToUpdate).length > 0) {

      //if there is something to update, then update the updated_at
      dataToUpdate.updated_at = new Date().toISOString();

      const { error: updateMobileError } = await supabase
        .from("ads")
        .update(dataToUpdate)
        .match({ user_id: userID, ads_id: mobile_id });

      if (updateMobileError) {
        throw updateMobileError;
      }
    } else {
      return res.status(200).json({ message: "Nothing changed." });
    }

    res.status(200).json({ message: "Updated successfully." });
  } catch (error) {
    return res.status(400).json({ errorMessage: error.message });
  }
};




/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const deleteAdsPhotoOneByOne = async (req, res) => {
  try {
    const userID = req.userData.userID.user_id;
    const mobile_id = req.params.id;
    const { imageIndex } = req.body;

  
    const { data, error } = await supabase
      .from("ads")
      .select("images")
      .match({ ads_id: mobile_id, user_id: userID });

    if (error) throw new Error("Error finding image");

    // Stop running when there is two images left
    if (data[0].images.length <= 2)
      throw new Error("Ad must have at least two images.");

    // this takes the directory of the image to be deleted
    const partOfImageLink = data[0].images[imageIndex].split("ecommerce/")[1];
    await sql`
            UPDATE ads 
            SET images = array_remove(images, ${`${data[0].images[imageIndex]}`}) 
            WHERE ads_id = ${mobile_id};
        `;

    const { error: deleteAdsError } = await supabase.storage
      .from("ecommerce")
      .remove([`${partOfImageLink}`]);

    if (deleteAdsError) throw new Error("Unexpected error happened");

    res.status(200).json({ message: "Image removed" });
  } catch (error) {
    return res.status(400).json({ errorMessage: error.message });
  }
};






// Check whether a user has an items marked as buy later...
// Some UI stuffs

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const savedAdsStatus = async(req, res)=>{
    try {
      const userID = req.userData.userID.user_id;
      const mobile_id = Number(req.params.id);
       
      if(!userID) return res.status(400).json({isValidUser: false});
      const getBuyLaterData = await sql`
           SELECT *
           FROM savedads
           WHERE user_id = ${userID} AND main_category = ${main_category}
           AND sub_category = ${sub_category}
      `;
      
      if(getBuyLaterData.length === 0 || !getBuyLaterData ) return res.status(200).json({buyLater: false });

      const findBuyLaterItem = getBuyLaterData.find((item)=> item.ads_id === mobile_id )

      if(!findBuyLaterItem) return res.status(200).json({buyLater: false });

      res.status(200).json({buyLater: true })
      
    } catch (err) {
      console.log(err.message);  
      res.status(400).json({buyLater: false })
    }
}



// BookMark Item to purchase later
/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const addToSaveAds = async (req, res) =>{
      try {
          const userID = req.userData.userID.user_id;
          const mobileId = req.params.id
          
          if( !mobileId || !sub_category || !main_category || !userID) throw new Error('Error saving ads');
          
          //check if users has add the items already
          const checkExistingBuyLater = await sql`
                 SELECT *
                 FROM savedads
                 WHERE user_id = ${userID} AND ads_id = ${mobileId}
                 AND main_category = ${main_category} AND sub_category = ${sub_category}
          `;


          if(checkExistingBuyLater.length === 0){
             const insertBuyLater = await sql`
              INSERT INTO savedads(main_category, sub_category, ads_id, user_id)
              VALUES(${main_category}, ${sub_category}, ${mobileId}, ${userID})
              RETURNING saved_ads_id
             `;
             if(insertBuyLater.length > 0){
               res.status(200).json({message: "Saved successfully"})
             }else{
               throw new Error('Something went wrong, retry')
             }
          }else{            
             const removeBuyLater = await sql`
               DELETE FROM savedads
               WHERE user_id = ${userID} AND ads_id = ${mobileId} 
               AND main_category = ${main_category} AND sub_category = ${sub_category}
               RETURNING *
             `;
             if(removeBuyLater.length > 0){
              res.status(200).json({message: "Removed successfully"})
            }else{
              throw new Error('Something went wrong, retry')
            }
          }
         
          
      } catch (err) {
        console.log(err.message);
         return res.status(400).json({message: err.message})
      }
}




