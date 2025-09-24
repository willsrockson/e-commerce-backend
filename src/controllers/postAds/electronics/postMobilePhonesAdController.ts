import { AuthRequest } from './../../../middleware/authorizationMiddleware';
import { Response} from "express";
import supabase from "../../../config/db/connection/supabaseStorageConn";
import sharp from "sharp";

import { deleteAllFilesAfterUpload } from "../../../utils/deleteFilesInUploads";
import { hashUserId } from '../../../utils/crypto.hashing';
import db from '../../../config/db/connection/dbConnection';
import { adsTable } from '../../../config/db/schema/ads/ads.schema';

interface IMobilePhoneMetaData {
    region: string;
    town: string;
    main_category: string;
    sub_category: string;
    title: string;
    description: string;
    brand: string;
    model: string;
    storage: string;
    ram: string;
    color: string;
    battery_size: string;
    battery_health: number;
    screen_size: string;
    condition: string;
    negotiable: string;
    exchange_possible: string;
    accessories: string[];
    price: string;
}

export const postMobilePhonesAds = async (req: AuthRequest, res: Response ) => {
  try {

    const userID = req.userData?.userID.user_id;
     if (!userID) {
      throw new Error("User not found.");
    }
    const files = req.files as Express.Multer.File[];
    const adsData: IMobilePhoneMetaData = req.body;
 
    // Checks to make sure there is data before posting.
    if (Object.values(adsData).some(value => 
        value === null || value === undefined || (typeof value === 'string' && value.trim() === '')
     )) {
          throw new Error('All fields must be filled');
     }
    

    // Checks for no file upload and limit
    if (!files || files?.length === 0) {
      throw new Error("No image provided.");
    }

    if (files?.length  === 1) {
     throw new Error("Images must be two or more.");
    }

    
    // Makes sure Accessories data is placed inside an array especially for
    // a single value since formData only sends an Array of accessories 
    //When two or more accessories was ticked by the user.
    const arrangeArr =(data: string | string[]): string[] | null =>{
          if(!data) return null;
          if(typeof data === 'string'){
             console.log('String: ', [data]);
             return [data];
          }
          if(Array.isArray(data)){
             return data
          }
          return null
    }      
    
    // map through each file upload it and delete the file
    const uploadAdImagePromises = files.map(async (file) => {
      // Take the file from /uploads, convert it and store it inside supabase storage
      const outputBuffer = await sharp(file.path)
        .webp({ quality: 95 })
        .rotate()
        .resize(1080, 810, { fit: "inside" })
        .toBuffer();
      
      const hashedID = hashUserId(userID);  
      const { data, error } = await supabase.storage
        .from("ecommerce")
        .upload(
          `ads-images/${hashedID}/${Date.now()}-${file.filename}.webp`,
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
 

    //   // Post for Mobilephones
    const saveMobilePhoneData = await db
        .insert(adsTable)
        .values({
            region: adsData.region,
            town: adsData.town,
            title: adsData.title,
            description: adsData.description,
            main_category: adsData.main_category,
            sub_category: adsData.sub_category,
            images: uRl?.map((url) => url.publicUrl),
            metadata: {
                brand: adsData.brand,
                model: adsData.model,
                storage: adsData.storage,
                ram: adsData.ram,
                color: adsData.color,
                battery_size: adsData.battery_size,
                battery_health: adsData?.battery_health ? Number(adsData.battery_health) : null,
                screen_size: adsData.screen_size,
                condition: adsData.condition,
                negotiable: adsData.negotiable,
                exchange_possible: adsData.exchange_possible,
                accessories: arrangeArr(adsData?.accessories) ?? null ,
                price: Number(adsData.price.replace(/,/g, "")),
            },
            user_id: userID,
        })
        .returning({ ads_id: adsTable.ads_id });

    if (saveMobilePhoneData.length === 0) {
       throw new Error("Failed to upload ad, please try again.");
    }

    deleteAllFilesAfterUpload("./uploads");

    res.status(200).json({ successMessage: "Published successfully" });
  } catch (err) {
    if (err instanceof Error) {
        console.error("From PostMobilePhoneController", err.message);
        res.status(400).json({ errorMessage: err.message});
        return;
    }
  }
};









