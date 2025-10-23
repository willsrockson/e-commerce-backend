import { Request, Response } from "express"
import db from "../config/db/connection/dbConnection"
import { adsTable } from "../config/db/schema/ads/ads.schema";
import { sql, eq, desc } from "drizzle-orm";
import { UserTable } from "../config/db/schema/user.schema";

export const NewPosts = async(_req: Request, res: Response)=>{

   try {

       const getNewAds = await db
         .select({
            ads_id: adsTable.ads_id,
            region: adsTable.region,
            town: adsTable.town,
            subCategory: adsTable.sub_category,
            mainCategory: adsTable.main_category,
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
         .where(eq(adsTable.deactivated, false))
         .orderBy(desc(adsTable.updated_at))
         .limit(20);
      
       if(getNewAds.length === 0){
          throw new Error('No new Ad found')
       }

      res.status(200).json(getNewAds)
      
   } catch (error) {
      if(error instanceof Error){
         console.log(String(error));
         res.status(400).json([])
         return;
      }
   }

}