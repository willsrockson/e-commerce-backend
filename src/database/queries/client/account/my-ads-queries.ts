import { eq, and, sql, SQL, count, desc } from "drizzle-orm";
import { AdsTable } from "../../../schema/client/contents/ads-schema.js";
import { db } from "../../../connection.js";

interface Filters {
   filters: SQL<unknown> | undefined;
   userID: string;
   offset?: number;
   limit?: number;
   main_category?: string;
}

export const publishedAdsQuery = async ({ userID, limit, offset, filters }: Filters) => {
   const data = await db
      .select({
         adsId: AdsTable.ads_id,
         firstImage: sql<string>`${AdsTable.images}[1]`.as("first_image"),
         price: sql<number>`metadata->>'price'`,
         description: AdsTable.description,
         title: AdsTable.title,
         region: AdsTable.region,
         town: AdsTable.town,
         deactivated: AdsTable.deactivated,
         mainCategory: AdsTable.main_category,
         subCategory: AdsTable.sub_category,
         slug: AdsTable.slug,
         mainSlug: AdsTable.main_slug,
         subSlug: AdsTable.sub_slug,
         createdAt: AdsTable.created_at,
         condition: sql<string>`metadata->>'condition'`,
      })
      .from(AdsTable)
      .where(and(eq(AdsTable.user_id, userID), filters))
      .orderBy(desc(AdsTable.updated_at))
      .offset(offset ?? 0)
      .limit(limit ?? 0);

   return data;
};

export const countPublishedAds = async ({ userID, filters }: Filters) => {
   const data = await db
      .select({
         ad_count: count(AdsTable.ads_id).as("ad_count"),
      })
      .from(AdsTable)
      .where(and(eq(AdsTable.user_id, userID), filters));

   return data;
};

export const mainCategoryCountQuery = async ({ userID, filters }: Filters) => {
   const main = await db
      .select({
         label: AdsTable.main_category,
         count: count(AdsTable.main_category),
      })
      .from(AdsTable)
      .where(and(eq(AdsTable.user_id, userID), filters))
      .groupBy(AdsTable.main_category);

   return main;
};

export const subCategoryCountQuery = async ({ userID, main_category, filters }: Filters) => {
   if (!main_category) return;

   const sub = await db
      .select({
         label: AdsTable.sub_category,
         count: count(AdsTable.sub_category),
      })
      .from(AdsTable)
      .where(and(eq(AdsTable.user_id, userID), filters))
      .groupBy(AdsTable.sub_category);

   return sub;
};
