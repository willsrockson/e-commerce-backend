import { Request, Response } from "express";
//import sql from "../../../config/dbConn.js";
//import pool from "../../../config/pgPool.js";
//import supabase from "../../../config/supabaseConn.js";
import sharp from "sharp";
import { deleteAllFilesAfterUpload } from "../../../utils/deleteFilesInUploads";

import { 
     mobilePhonesQuery,
     countMobilePhoneQuery,
     regionQuery,
     townQuery,
     brandQuery,
     modelQuery,
     conditionQuery,
     ramQuery,
     storageQuery,
     colorQuery,
     screenSizeQuery,
     exchangePossibleQuery,
     negotiableQuery,
     veriFiedSellerQuery,
     defaultWhere
     
} 
from "../../../utils/sql.queries/categories/electronics/mobilephonesQueries";
import { and, eq, gte, lte, ne, sql, desc, count } from "drizzle-orm";
import { adsTable, savedAdTable } from "../../../config/db/schema/ads/ads.schema";
import { AvatarTable, UserTable } from "../../../config/db/schema/user.schema";
import db from "../../../config/db/connection/dbConnection";
import { AuthRequest } from "../../../middleware/authorizationMiddleware";

const main_category = 'electronics';
const sub_category = 'mobilephones';

interface IBuyLater{
  ads_id: string;
  title: string; 
  phone_primary: string; 
  condition: string; 
  image_url:string; 
  price: number; 
  location: string;
}

const savedWhereClause = and(eq(savedAdTable.sub_category, sub_category), eq(savedAdTable.main_category, main_category));

interface IQuery{
  region?: string;
  town?: string;
  brand?: string;
  model?: string;
  condition?: string;
  price_min?: string;
  price_max?: string;
  storage?: string;
  color?: string;
  ram?: string;
  screen_size?: string;
  exchange_possible?: string;
  negotiable?: string;
  id_verification_status?: string;
}

interface IQueryType{
  region?: string;
  town?: string;
  brand?: string;
  model?: string;
  price_min?: string;
  price_max?: string;
  storage?: string;
  color?: string;
  ram?: string;
  screen_size?: string;
  exchange_possible?: string;
  negotiable?: string;
  id_verification_status?: string;
}

export const fetchMobilePhones = async (req: Request, res: Response): Promise<void> => {
   const page = Number(req.query.page) || 1;
   const limit = Number(req.query.limit) || 20;
   const offset = (page - 1) * limit;

   const query = req.query as IQueryType;
   
   
   function cleanPrice(price: string ):number {
      if(!price) return 0
      let cleaned = price.replace(/,/g, "");
      return Number(cleaned);
   }
    
  function buildFilters(query: IQuery, wanted: (keyof IQuery)[]) {
        const conditions = [];

        if (wanted.includes('region') && query.region) {
            conditions.push(eq(adsTable.region, query.region));
        }
        if (wanted.includes('town') && query.town) {
            conditions.push(eq(adsTable.town, query.town));
        }
        if(wanted.includes('brand') && query.brand){
          conditions.push(eq(sql`${adsTable.metadata}->>'brand'`, query.brand));
        }
        if(wanted.includes('model') && query.model){
           conditions.push(eq(sql`${adsTable.metadata}->>'model'`, query.model));
        }
         if(wanted.includes('condition') && query.condition){
           conditions.push(eq(sql`${adsTable.metadata}->>'condition'`, query.condition));
        }
        if(wanted.includes('price_min') && query.price_min){
          conditions.push(gte(sql`(${adsTable.metadata}->>'price')::int`, cleanPrice(query.price_min)));
        }
        if(wanted.includes('price_max') && query.price_max){
          conditions.push(lte(sql`(${adsTable.metadata}->>'price')::int`, cleanPrice(query.price_max)));
        }
        if(wanted.includes('storage') && query.storage){
          conditions.push(eq(sql`${adsTable.metadata}->>'storage'`, query.storage));
        }
        if(wanted.includes('color') && query.color){
          conditions.push(eq(sql`${adsTable.metadata}->>'color'`, query.color));
        }
        if(wanted.includes('ram') && query.ram){
          conditions.push(eq(sql`${adsTable.metadata}->>'ram'`, query.ram));
        }
        if(wanted.includes('screen_size') && query.screen_size){
          conditions.push(eq(sql`${adsTable.metadata}->>'screen_size'`, query.screen_size));
        }
        if(wanted.includes('exchange_possible') && query.exchange_possible){
          conditions.push(eq(sql`${adsTable.metadata}->>'exchange_possible'`, query.exchange_possible));
        }
        if(wanted.includes('negotiable') && query.negotiable){
          conditions.push(eq(sql`${adsTable.metadata}->>'negotiable'`, query.negotiable));
        }
        if(wanted.includes('id_verification_status') && query.id_verification_status){
          conditions.push(eq(sql`${UserTable.id_verification_status}::text`, query.id_verification_status));
        }

        return conditions.length > 0 ? and(...conditions) : undefined;
    }

   
     try {
                  
          const allFilters = buildFilters(req.query, ["region", "town", "brand", "model", 'condition', 'price_min', 'price_max', "ram", "storage", "color", "screen_size", "exchange_possible", "negotiable", "id_verification_status"]);
          const regionFilters = buildFilters(req.query, ["brand", "model", "condition", "price_min", 'price_max', "ram", "storage", "color", "screen_size", "exchange_possible", "negotiable", "id_verification_status"]);
          const townFilters = buildFilters(req.query, ["brand", "model", "condition", "price_min", 'price_max', "ram", "storage", "color", "screen_size", "exchange_possible", "negotiable", "id_verification_status"]);
          const brandFilters = buildFilters(req.query, ["region", "town", "condition", "price_min", 'price_max', "ram", "storage", "color", "screen_size", "exchange_possible", "negotiable", "id_verification_status"]);
          const modelFilters = buildFilters(req.query, ["region", "town", "brand", "condition", "price_min", 'price_max', "ram", "storage", "color", "screen_size", "exchange_possible", "negotiable", "id_verification_status"]);
          const conditionFilters = buildFilters(req.query, ["region", "town", "brand", "model", "price_min", 'price_max', "ram", "storage", "color", "screen_size", "exchange_possible", "negotiable", "id_verification_status"]);
          const storageFilters = buildFilters(req.query, ["region", "town", "brand", "model", 'condition', 'price_min', 'price_max', "ram", "color", "screen_size", "exchange_possible", "negotiable", "id_verification_status"]);
          const ramFilters = buildFilters(req.query, ["region", "town", "brand", "model", 'condition', 'price_min', 'price_max', "storage", "color", "screen_size", "exchange_possible", "negotiable", "id_verification_status"]);
          const colorFilters = buildFilters(req.query, ["region", "town", "brand", "model", 'condition', 'price_min', 'price_max', "storage", "screen_size", "exchange_possible", "negotiable", "id_verification_status"]);
          const screenSizeFilters = buildFilters(req.query, ["region", "town", "brand", "model", 'condition', 'price_min', 'price_max', "ram", "storage", "color", "exchange_possible", "negotiable", "id_verification_status"]);
          const exchangePossibleFilters = buildFilters(req.query, ["region", "town", "brand", "model", 'condition', 'price_min', 'price_max', "ram", "storage", "color", "screen_size", "negotiable", "id_verification_status"]);
          const negotiableFilters = buildFilters(req.query, ["region", "town", "brand", "model", 'condition', 'price_min', 'price_max', "ram", "storage", "color", "screen_size", "exchange_possible", "id_verification_status"]);
          const verifiedSellerFilters = buildFilters(req.query, ["region", "town", "brand", "model", 'condition', 'price_min', 'price_max', "ram", "storage", "color", "screen_size", "exchange_possible", "negotiable"]);






          const [mobilePhones, countMobilePhone, countRegion,countTown ,countBrand, countModel, countCondition, countStorage, countColor ,countRam, countScreenSize, countExchangePossible, countNegotiable, countVerifiedSellers] = await Promise.all(
            [
              mobilePhonesQuery({filters: allFilters, limit: limit, offset: offset}),
              countMobilePhoneQuery({filters: allFilters}),
              regionQuery({filters:regionFilters}),
              townQuery({region: query.region, filters: townFilters}),
              brandQuery({filters: brandFilters}),
              modelQuery({filters: modelFilters, brand: query.brand}),
              conditionQuery({filters: conditionFilters}),
              storageQuery({filters: storageFilters}),
              colorQuery({filters: colorFilters, model: query.model}),
              ramQuery({filters: ramFilters}),
              screenSizeQuery({filters: screenSizeFilters}),
              exchangePossibleQuery({filters: exchangePossibleFilters}),
              negotiableQuery({filters: negotiableFilters}),
              veriFiedSellerQuery({filters: verifiedSellerFilters})
            ])


        const total = countMobilePhone[0].mobile_count;
        
        res.json({
               phones: mobilePhones,
               countAds:{
                    region: countRegion,
                    town: countTown ,
                    brand: countBrand,
                    model: countModel,
                    condition: countCondition,
                    storage: countStorage,
                    color: countColor,
                    ram: countRam,
                    screenSize: countScreenSize,
                    exchangePossible: countExchangePossible,
                    negotiable: countNegotiable,
                    verifiedSellers: countVerifiedSellers
               },
               total,
               hasMore: offset + mobilePhones.length < total,
               page: page
         });

      
     } catch (error) {
        if(error instanceof Error){
          console.error(error.message);
          res.status(200).json([])
          return;
        }
     }

  
};





// Function below gets each phones clicked on the site
export const getEachPhoneById = async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  const { id } = req.params;

  try {

    if(!id){
      throw new Error('no ads ID provided')
    }

    const onePhoneQuery = await db
        .select({
          ads_id: adsTable.ads_id,
          region: adsTable.region,
          town: adsTable.town,
          description: adsTable.description,
          title: adsTable.title,
          images: adsTable.images,
          color: sql<string>`${adsTable.metadata}->>'color'`.as('color'),
          storage: sql<string>`${adsTable.metadata}->>'storage'`.as('storage'),
          ram: sql<string>`${adsTable.metadata}->>'ram'`.as('ram'),
          exchangePossible: sql<string>`${adsTable.metadata}->>'exchange_possible'`.as('exchange_possible'),
          price: sql<number>`${adsTable.metadata}->>'price'`.as('price'),
          brand: sql<string>`${adsTable.metadata}->>'brand'`.as('brand'),
          model: sql<string>`${adsTable.metadata}->>'model'`.as('model'),
          negotiable: sql<string>`${adsTable.metadata}->>'negotiable'`.as('negotiable'),
          condition: sql<string>`${adsTable.metadata}->>'condition'`.as('condition'),
          screenSize: sql<string>`${adsTable.metadata}->>'screen_size'`.as('screen_size'),
          batterySize: sql<string>`${adsTable.metadata}->>'battery_size'`.as('battery_size'),
          batteryHealth: sql<string>`${adsTable.metadata}->'battery_health'`.as('battery_health'),
          accessories: sql<string[]>`${adsTable.metadata}->'accessories'`.as('accessories'),
          createdAt: adsTable.created_at,
          avatarImageUrl: AvatarTable.image_url,
          storename: UserTable.store_name,
          fullname: UserTable.full_name,
          phonePrimary: UserTable.phone_primary,
          phoneSecondary: UserTable.phone_secondary,
          userIdVerificationStatus: UserTable.id_verification_status,
          userCreatedAt: UserTable.created_at

        })
        .from(adsTable)
        .innerJoin(UserTable, eq(UserTable.user_id, adsTable.user_id))
        .leftJoin(AvatarTable, eq(AvatarTable.user_id, UserTable.user_id))
        .where(and(eq(adsTable.ads_id, id), defaultWhere));   
        
   
    const relatedListingQuery = await db
         .select({
            ads_id: adsTable.ads_id,
            region: adsTable.region,
            town: adsTable.town,
            firstImage: sql<string>`${adsTable.images}[1]`.as("first_image"),
            title: adsTable.title,
            userIdVerificationStatus: UserTable.id_verification_status, 
            description: adsTable.description,
            createdAt: adsTable.created_at,
            price: sql<number>`metadata->>'price'`,
            condition: sql<string>`metadata->>'condition'`
         })
         .from(adsTable)
         .innerJoin(UserTable, eq(UserTable.user_id, adsTable.user_id))
         .where(and(ne(adsTable.ads_id, id), defaultWhere , eq(sql`${adsTable.metadata}->>'model'`, onePhoneQuery[0]?.model)))
         .orderBy(desc(adsTable.updated_at))
         .offset(offset ?? 0)
         .limit(limit ?? 0);


    const countRelatedListingQuery = await db
        .select({
            mobile_count: count(adsTable.ads_id).as("mobile_count"),
        })
        .from(adsTable)
        .innerJoin(UserTable, eq(UserTable.user_id, adsTable.user_id))
        .where(and(defaultWhere, ne(adsTable.ads_id, id),  eq(sql`${adsTable.metadata}->>'model'`, onePhoneQuery[0]?.model)));


    const [onePhone, relatedListing, countRelatedListing] = await Promise.all([
       onePhoneQuery,
       relatedListingQuery,
       countRelatedListingQuery
    ])  
    
    
    if (onePhone.length === 0) {
      throw new Error("Phone not found");
    }  
     const total = countRelatedListing[0].mobile_count;
        
        res.json({
               onePhone,
               relatedListing,
               total,
               hasMore: offset + relatedListing.length < total,
               page: page
         });       
   
  } catch (error) {
    if(error instanceof Error){
      console.log('getEachPhoneByID:', error.message);
      res.status(401).json([]);
      return
    }
  }
};





// // Get MobilePhone data For editing

// export const fetchMobilePhoneForEditing = async(req, res)=>{
      
//       try {
//          const { id } = req.params;
//          const userID = req.userData.userID.user_id;         

//          if(!userID) throw new Error('User not found')

//          const phone = await sql`
//             SELECT 
//             ads.ads_id, 
//             ads.region, 
//             ads.town, 
//             ads.description, 
//             ads.title, 
//             ads.images,
//             (metadata->>'color') color, 
//             (metadata->>'disk_space') disk_space, 
//             (metadata->>'ram_size') ram_size, 
//             (metadata->>'exchange_possible') exchange_possible,
//             (metadata->>'price') price, 
//             (metadata->>'brand') brand,
//             (metadata->>'model') model,  
//             (metadata->>'negotiable') negotiable, 
//             (metadata->>'condition') condition 
//             FROM ads
//             WHERE ads.ads_id = ${id} AND ads.main_category = ${main_category} 
//             AND ads.sub_category = ${sub_category} AND ads.user_id = ${userID}
//          `;
          
//           if(!phone || phone.length === 0) throw new Error('Phone not found')

//           res.status(200).json(phone);
        
//       } catch (error) {
//          console.log(error.message);
//          res.status(401).json([])
//       }
// }




// /**
//  * @param {import('express').Request} req
//  * @param {import('express').Response} res
//  */
export const editMobilePhoneDetails = async (req: AuthRequest, res: Response) => {
//   const expectedPhotos = 7;

//   try {
//     const userID = req.userData.userID.user_id;
//     const mobile_id = req.params.id;
//     const files = req.files;
//     const {
//       region,
//       town,
//       brand,
//       model,
//       color,
//       storage,
//       ram,
//       negotiable,
//       condition,
//       description,
//       title,
//       exPossible,
//       price,
//     } = req.body;


//     if (err) throw new Error(err.message);

//     // Adding or changing photos logic
//     if (files.length > 0) {
//       const { data, error } = await supabase
//         .from("ads")
//         .select("images")
//         .match({ ads_id: mobile_id, user_id: userID });

//       if (error) throw new Error("Error finding image");

//       const numberOfPhotos =
//         files.length + data[0].images.length > expectedPhotos;
//       if (numberOfPhotos) {
//         deleteAllFilesAfterUpload("./uploads");
//         throw new Error(`Total uploads can't be more than ${expectedPhotos}`);
//       }
      
//       // map through each file upload it
//       const uploadAdImagePromises = files.map(async (file) => {
//         // Take the file from /uploads, convert it and store it inside supabase storage
//         const outputBuffer = await sharp(file.path)
//           .webp({ quality: 95 })
//           .rotate()
//           .resize(1080, 810, { fit: "inside" })
//           .toBuffer()

//         const { data, error: upLoadError } = await supabase.storage
//           .from("ecommerce")
//           .upload(
//             `ads-images/${userID}/${Date.now()}-${file.filename}.webp`,
//             outputBuffer,
//             {
//               cacheControl: "3600",
//               upsert: false,
//             }
//           );

//         if (upLoadError) {
//           throw upLoadError;
//         }

//         return data;
//       });
//       const results = await Promise.all(uploadAdImagePromises);

//       const getAllUrl = results.map(async (result) => {
//         const { data: Url } = supabase.storage
//           .from("ecommerce")
//           .getPublicUrl(result.path);

//         return Url;
//       });
//       const uRl = await Promise.all(getAllUrl);

//       await sql`
//            UPDATE ads 
//            SET images = array_cat(images, ${uRl?.map(url => url.publicUrl)}) 
//            WHERE ads_id = ${mobile_id} AND user_id = ${userID};

//       `
//       deleteAllFilesAfterUpload("./uploads");
      
//       if(!region &&
//         !town &&
//         !brand &&
//         !model &&
//         !color &&
//         !storage &&
//         !ram &&
//         !negotiable &&
//         !condition &&
//         !description &&
//         !title &&
//         !exPossible &&
//         !price ){
//            return res.status(200).json({ message: "Updated successful" });
           
//         }  
//     } // Files upload ends here
     
    
//     // Fetch old metadata from DB
//     const { data: metaData } = await supabase
//      .from('ads')
//      .select('metadata')
//      .match({ ads_id: mobile_id, user_id: userID })
//      .single(); 

//     let dataToUpdate = {}; // It creates an object of all changes made
//      if (region) dataToUpdate.region = region;
//      if (town) dataToUpdate.town = town;
//      if (description) dataToUpdate.description = description;
//      if (title) dataToUpdate.title = title;
//      if(brand || model || color || storage || ram || negotiable || condition || exPossible || price){
//        dataToUpdate.metadata ={
//            brand: (brand ? brand : metaData.metadata.brand),
//            color: (color ? color : metaData.metadata.color),
//            model: (model ? model : metaData.metadata.model),
//            price: (price ? price : metaData.metadata.price),
//            ram_size: (ram ? ram : metaData.metadata.ram_size),
//            condition: (condition ? condition : metaData.metadata.condition),
//            disk_space: (storage ? storage : metaData.metadata.disk_space),
//            negotiable: (negotiable ? negotiable : metaData.metadata.negotiable),
//            exchange_possible: (exPossible ? exPossible : metaData.metadata.exchange_possible)
//        }
//      }
    
//     // Only update when changes has been made
//     if (Object.keys(dataToUpdate).length > 0) {

//       //if there is something to update, then update the updated_at
//       dataToUpdate.updated_at = new Date().toISOString();

//       const { error: updateMobileError } = await supabase
//         .from("ads")
//         .update(dataToUpdate)
//         .match({ user_id: userID, ads_id: mobile_id });

//       if (updateMobileError) {
//         throw updateMobileError;
//       }
//     } else {
//       return res.status(200).json({ message: "Nothing changed." });
//     }

//     res.status(200).json({ message: "Updated successfully." });
//   } catch (error) {
//     return res.status(400).json({ errorMessage: error.message });
//   }
};




// /**
//  * @param {import('express').Request} req
//  * @param {import('express').Response} res
//  */
// export const deleteAdsPhotoOneByOne = async (req, res) => {
//   try {
//     const userID = req.userData.userID.user_id;
//     const mobile_id = req.params.id;
//     const { imageIndex } = req.body;

  
//     const { data, error } = await supabase
//       .from("ads")
//       .select("images")
//       .match({ ads_id: mobile_id, user_id: userID });

//     if (error) throw new Error("Error finding image");

//     // Stop running when there is two images left
//     if (data[0].images.length <= 2)
//       throw new Error("Ad must have at least two images.");

//     // this takes the directory of the image to be deleted
//     const partOfImageLink = data[0].images[imageIndex].split("ecommerce/")[1];
//     await sql`
//             UPDATE ads 
//             SET images = array_remove(images, ${`${data[0].images[imageIndex]}`}) 
//             WHERE ads_id = ${mobile_id};
//         `;

//     const { error: deleteAdsError } = await supabase.storage
//       .from("ecommerce")
//       .remove([`${partOfImageLink}`]);

//     if (deleteAdsError) throw new Error("Unexpected error happened");

//     res.status(200).json({ message: "Image removed" });
//   } catch (error) {
//     return res.status(400).json({ errorMessage: error.message });
//   }
// };






export const countSavedAd = async (req: Request, res: Response) => {
    try {
        const ads_id = req.params.id;

        if (!ads_id) {
            res.status(200).json({ total: 0 });
            return;
        }

        const countBookmark = await db
            .select({
                total: count(savedAdTable.ads_id),
            })
            .from(savedAdTable)
            .where(and(savedWhereClause, eq(savedAdTable.ads_id, ads_id)));

        res.status(200).json(...countBookmark);
    } catch (error) {
        if (error instanceof Error) {
            console.error(String(error));
            res.status(400).json({ total: 0 });
        }
    }
};




// // Check whether a user has an items marked as buy later...
// // Some UI stuffs

export const savedAdsStatus = async(req: AuthRequest, res: Response)=>{
    try {
      const userID = req.userData?.userID.user_id;
      const ads_id = req.params.id;
       
      if(!userID || !ads_id){
         res.status(200).json({buyLater: false });
         return;
      }    

      const getBuyLaterData = await db
        .select({
            saved_id: savedAdTable.saved_id
        })
        .from(savedAdTable)
        .where(and(savedWhereClause, eq(savedAdTable.user_id, userID), eq(savedAdTable.ads_id, ads_id)));
 
      if(getBuyLaterData.length === 0 || !getBuyLaterData ){
         res.status(200).json({buyLater: false });
         return;
      }
  
      res.status(200).json({buyLater: true })
      
    } catch (err) {
      if(err instanceof Error){
        console.error(String(err));  
        res.status(400).json({buyLater: false })
      }
    }
}



// BookMark Item to purchase later

export const addToSaveAds = async (req: AuthRequest, res: Response) =>{
      try {
          const userID = req.userData?.userID.user_id;
          const body = req.body as IBuyLater
          //const data = req.params.id
          
          if(!userID) throw new Error("User not found.");
          if (
              Object.values(body).some(
                  (value) =>
                      value === null ||
                      value === undefined ||
                      (typeof value === "string" && value.trim() === "")
              )
          ) {
              throw new Error("We couldn't save ad. Please retry.");
          }


          const owner = await db
                .select({
                   user_id: UserTable.user_id
                })
                .from(adsTable)
                .innerJoin(UserTable, eq(UserTable.user_id, adsTable.user_id))
                .where(and(defaultWhere, eq(adsTable.ads_id, body.ads_id)));

          if(owner.length === 0){
            throw new Error("We couldn't find the owner of the ad");
          }
          if(owner[0].user_id === userID){
             throw new Error("You can't save your own ad");
          }    

          //check if users has add the items already

          const checkExistingBuyLater  = await db
              .select({
                  saved_id: savedAdTable.saved_id
              })
              .from(savedAdTable)
              .where(and(savedWhereClause, eq(savedAdTable.user_id, userID), eq(savedAdTable.ads_id, body.ads_id)));

          if(checkExistingBuyLater.length === 0){
            const insertBuyLater = await db
                .insert(savedAdTable)
                .values({
                  main_category: main_category,
                  sub_category: sub_category,
                  ads_id: body?.ads_id,
                  owner_user_id: owner[0]?.user_id,
                  user_id: userID,
                  title: body?.title,
                  phone_primary: body?.phone_primary,
                  condition: body?.condition,
                  location: body?.location,
                  image_url: body?.image_url,
                  price: body?.price
                }).returning({id: savedAdTable.saved_id});

             if(insertBuyLater.length > 0){
               res.status(200).json({message: "Saved successfully"})
             }else{
               throw new Error("We couldn't save your ad, please retry")
             }
          }else{    
            const removeBuyLater = await db
                .delete(savedAdTable)
                .where(
                    and(
                        savedWhereClause,
                        eq(savedAdTable.user_id, userID),
                        eq(savedAdTable.ads_id, body.ads_id)
                    )
                )
                .returning({ id: savedAdTable.saved_id });      
             if(removeBuyLater.length > 0){
              res.status(200).json({message: "Removed successfully"})
            }else{
              throw new Error('Something went wrong, retry')
            }
          }
          
      } catch (err) {
        if(err instanceof Error){
          console.error(String(err));
          res.status(400).json({errorMessage: err.message})
          return;
        }
         
      }
}




