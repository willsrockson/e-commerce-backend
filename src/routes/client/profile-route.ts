import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { CODES } from "../../config/constants.js";
import { db } from "../../database/connection.js";
import { AvatarTable, UserTable } from "../../database/schema/client/user-schema.js";
import { eq, and, sql, desc } from "drizzle-orm";
import type { MyAds } from "../../types/client/types.js";
import { AdsTable } from "../../database/schema/client/contents/ads-schema.js";
import { countPublishedAds, mainCategoryCountQuery, publishedAdsQuery, subCategoryCountQuery } from "../../database/queries/client/account/my-ads-queries.js";

const profile = new Hono()

profile.get("/settings/:store-name-slug", async (c) => {
   const storeNameSlug = c.req.param("store-name-slug");

   try {
      if (!storeNameSlug.trim()) {
         throw new HTTPException(CODES.HTTP.UNAUTHORIZED_ACCESS, { message: "Invalid store name" });
      }
      const profile = db
         .select({
            userId: UserTable.user_id,
            storeName: UserTable.store_name,
            fullName: UserTable.full_name,
            email: UserTable.email,
            phonePrimary: UserTable.phone_primary,
            phoneSecondary: UserTable.phone_secondary,
            emailVerified: UserTable.email_verified,
            idVerified: UserTable.id_verified,
            phonePrimaryVerified: UserTable.phone_primary_verified,
            phoneSecondaryVerified: UserTable.phone_secondary_verified,
            storeDescription: UserTable.store_description,
            openHours: UserTable.open_hours,
            storeAddress: UserTable.store_address,
            userCreatedAt: UserTable.created_at,
            avatarId: AvatarTable.avatar_id,
            imageUrl: AvatarTable.image_url,
            updatedAt: AvatarTable.updated_at,
         })
         .from(UserTable)
         .leftJoin(AvatarTable, eq(UserTable.user_id, AvatarTable.user_id))
         .where(eq(UserTable.store_name_slug, storeNameSlug));

      const newPhones = db
         .select({
            adsId: AdsTable.ads_id,
            region: AdsTable.region,
            town: AdsTable.town,
            slug: AdsTable.slug,
            mainSlug: AdsTable.main_slug,
            subSlug: AdsTable.sub_slug,
            firstImage: sql<string>`${AdsTable.images}[1]`.as("first_image"),
            title: AdsTable.title,
            idVerified: UserTable.id_verified,
            description: AdsTable.description,
            createdAt: AdsTable.created_at,
            price: sql<number>`metadata->>'price'`,
            condition: sql<string>`metadata->>'condition'`,
         })
         .from(AdsTable)
         .innerJoin(UserTable, eq(UserTable.user_id, AdsTable.user_id))
         .where(and(eq(UserTable.store_name_slug, storeNameSlug), eq(AdsTable.deactivated, false)))
         .orderBy(desc(AdsTable.created_at))
         .limit(8);

      const [profileData, newPhonesData] = await Promise.all([profile, newPhones]);

      console.log(profileData, newPhonesData);
      

      return c.json({ profile: profileData[0], phones: newPhonesData }, 200);
   } catch {
      return c.json({}, 200);
   }
});







profile.get("/shop/:store-name-slug/ads", async (c) => {
   const page = Number(c.req.query("page")) || 1;
   const limit = Number(c.req.query("limit")) || 20;
   const offset = (page - 1) * limit;
   const query = c.req.query() as MyAds;
   const storeNameSlug = c.req.param("store-name-slug");

   if (!storeNameSlug.trim()) {
      throw new HTTPException(CODES.HTTP.BAD_REQUEST, {
         message: "Shop name not found or invalid",
      });
   }

   function filterBuilder(query: MyAds, wanted: (keyof MyAds)[]) {
      const conditions = [];
      if (wanted.includes("main_category") && query.main_category) {
         conditions.push(eq(AdsTable.main_category, query.main_category));
      }
      if (wanted.includes("sub_category") && query.sub_category) {
         conditions.push(eq(AdsTable.sub_category, query.sub_category));
      }

      return conditions.length > 0 ? and(...conditions) : undefined;
   }

   try {
      const [{ userId }] = await db
         .select({ userId: UserTable.user_id })
         .from(UserTable)
         .where(eq(UserTable.store_name_slug, storeNameSlug));

      if (!userId.trim()) {
         throw new HTTPException(CODES.HTTP.BAD_REQUEST, {
            message: "Invalid shop id",
         });
      }
      const allFilters = filterBuilder(query, ["main_category", "sub_category"]);
      const mainCategoryFilters = filterBuilder(query, ["main_category"]);

      const [publishedAds, countAllAd, mainCount, subCount] = await Promise.all([
         publishedAdsQuery({ userID: userId, limit: limit, offset: offset, filters: allFilters, optionalFilter: eq(AdsTable.deactivated, false) }),
         countPublishedAds({ userID: userId, filters: allFilters, optionalFilter: eq(AdsTable.deactivated, false) }),
         mainCategoryCountQuery({ userID: userId, filters: mainCategoryFilters, optionalFilter: eq(AdsTable.deactivated, false) }),
         subCategoryCountQuery({
            userID: userId,
            main_category: query.main_category,
            filters: mainCategoryFilters,
            optionalFilter: eq(AdsTable.deactivated, false)
         }),
      ]);

      const total = countAllAd[0].ad_count;
      return c.json(
         {
            publishedAds,
            countAds: {
               main: mainCount,
               sub: subCount,
            },
            total,
            hasMore: offset + publishedAds.length < total,
            page: page,
         },
         200,
      );
   } catch {
      return c.json([]);
   }
});



export default profile;
