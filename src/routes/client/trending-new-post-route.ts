import { Hono } from "hono";
import { db } from "../../database/connection.js";
import { AdsTable } from "../../database/schema/client/contents/ads-schema.js";
import { sql, desc, eq } from "drizzle-orm";
import { UserTable } from "../../database/schema/client/user-schema.js";

const trendingNewPost = new Hono()

trendingNewPost.get("/new/posts", async(c)=>{
    const getNewAds = await db
         .select({
            adsId: AdsTable.ads_id,
            region: AdsTable.region,
            town: AdsTable.town,
            slug: AdsTable.slug,
            subCategory: AdsTable.sub_category,
            mainSlug: AdsTable.main_slug,
            subSlug: AdsTable.sub_slug,
            mainCategory: AdsTable.main_category,
            firstImage: sql<string>`${AdsTable.images}[1]`.as("first_image"),
            title: AdsTable.title,
            idVerified: UserTable.id_verified, 
            description: AdsTable.description,
            createdAt: AdsTable.created_at,
            price: sql<number>`metadata->>'price'`,
            condition: sql<string>`metadata->>'condition'`
         })
         .from(AdsTable)
         .innerJoin(UserTable, eq(UserTable.user_id, AdsTable.user_id))
         .where(eq(AdsTable.deactivated, false))
         .orderBy(desc(AdsTable.updated_at))
         .limit(20);
      
       if(getNewAds.length === 0){
          throw new Error('No new Ad found')
       }

      return c.json(getNewAds, 200)
})



export default trendingNewPost;