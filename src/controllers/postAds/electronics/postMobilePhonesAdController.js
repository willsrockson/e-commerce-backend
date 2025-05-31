import supabase from "../../../config/supabaseConn.js";
import sharp from "sharp";

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
import { deleteAllFilesAfterUpload } from "../../../utils/deleteFilesInUploads.js";
import sql from "../../../config/dbConn.js";

export const postMobilePhonesAds = async (req, res, err) => {
  try {
    if (err) return res.status(400).json({ error: err.message });

    const userID = req.userData.userID.user_id; // get the ID of the logged in user
    const files = req.files;
    const adsInformation = req.body;
    
    // Checks to make sure there is data before posting.
    if (Object.values(adsInformation).some(value => 
        value === null || value === undefined || (typeof value === 'string' && value.trim() === '')
     )) {
          return res.status(400).json({ error: 'All fields must be filled' });
     }
    
    console.log(adsInformation);
    
    if (!userID) {
      throw new Error("User not found.");
    }

    // Checks for no file upload and limit
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No image provided." });
    }

    if (files.length < 2) {
      return res.status(400).json({ error: "Images must be two or more." });
    }

    if (files.length > 7) {
      return res
        .status(400)
        .json({ error: "Can`t upload more than 7 images." });
    }


    // map through each file upload it and delete the file
    const uploadAdImagePromises = files.map(async (file) => {
      // Take the file from /uploads, convert it and store it inside supabase storage
      const outputBuffer = await sharp(file.path)
        .webp({ quality: 95 })
        .rotate()
        .resize(1080, 810, { fit: "inside" })

        .toBuffer();

      const { data, error } = await supabase.storage
        .from("ecommerce")
        .upload(
          `ads-images/${userID}/${Date.now()}-${file.filename}.webp`,
          outputBuffer,
          {
            cacheControl: "3600",
            upsert: false,
          }
        );

       if (error) {
        throw error;
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

      // Post for Mobilephones
    const { error: uploadError } = await supabase
        .from("ads")
        .insert({
          region: adsInformation.region,
          town: adsInformation.town,
          title: adsInformation.title,
          description: adsInformation.description,
          main_category: adsInformation.main_category,
          sub_category: adsInformation.sub_category,   
          images: uRl?.map((url) => url.publicUrl),
          metadata:{
             brand: adsInformation.brand,
             model: adsInformation.model,
             color: adsInformation.color,
             disk_space: adsInformation.internal_storage,
             ram_size: adsInformation.ram_size,
             exchange_possible: adsInformation.exchange_possible,
             price: adsInformation.price,
             negotiable: adsInformation.negotiable,
             condition: adsInformation.condition,
          },    
          user_id: userID,
        });

    if (uploadError) {
        throw uploadError;
    }

    deleteAllFilesAfterUpload("./uploads");

    res.status(200).json({ message: "Published successfully" });
  } catch (err) {
    console.log("From adsController", err.message);
    return res.status(400).json({ error: "Upload failed" });
  }
};









