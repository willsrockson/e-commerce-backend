import db from "../../../../config/db/connection/dbConnection";
import { eq, and, sql, SQL, count, desc } from "drizzle-orm";
import { adsTable } from "../../../../config/db/schema/ads/ads.schema";

interface IFilters{
     filters: SQL<unknown> | undefined;
     userID: string;
     offset?: number;
     limit?: number
     main_category?: string;
}

export const publishedAdsQuery = async ({userID, limit, offset,filters}: IFilters)=>{
     
    const data = await db
       .select({
           ads_id: adsTable.ads_id,
           firstImage: sql<string>`${adsTable.images}[1]`.as("first_image"),
           price: sql<number>`metadata->>'price'`,
           description: adsTable.description,
           title: adsTable.title,
           region: adsTable.region,
           town: adsTable.town,
           deactivated: adsTable.deactivated,
           main_category: adsTable.main_category,
           sub_category: adsTable.sub_category,
           createdAt: adsTable.created_at,
           condition: sql<string>`metadata->>'condition'`
       })
       .from(adsTable)
       .where(and(eq(adsTable.user_id, userID), filters))
       .orderBy(desc(adsTable.updated_at))
       .offset(offset ?? 0)
       .limit(limit ?? 0);

       return data;   
}

export const countPublishedAds = async ({userID, filters}: IFilters)=>{
     
    const data = await db
       .select({
           ad_count: count(adsTable.ads_id).as("ad_count"),
       })
       .from(adsTable)
       .where(and(eq(adsTable.user_id, userID), filters));

       return data;   
}


export const mainCategoryCountQuery = async({userID, filters}: IFilters)=>{

     const main = await db
       .select({
          label: adsTable.main_category,
          count: count(adsTable.main_category)
       })
       .from(adsTable)
       .where(and(eq(adsTable.user_id, userID), filters))
       .groupBy(adsTable.main_category);

       return main;
}


export const subCategoryCountQuery = async({userID, main_category, filters}: IFilters)=>{

      if(!main_category) return;

      const sub = await db
       .select({
          label: adsTable.sub_category,
          count: count(adsTable.sub_category)
       })
       .from(adsTable)
       .where(and(eq(adsTable.user_id, userID), filters))
       .groupBy(adsTable.sub_category);

       return sub;
}