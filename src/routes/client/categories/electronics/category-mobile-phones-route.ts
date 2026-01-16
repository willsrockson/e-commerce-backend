import { Hono } from "hono";
import { db } from "../../../../database/connection.js";
import { eq, or, sql, and, count } from "drizzle-orm";
import type { CloudinaryUploader, Payload } from "../../../../types/client/types.js";
import { HTTPException } from "hono/http-exception";
import { CATEGORIES, CODES, ROLE } from "../../../../config/constants.js";
import { AdsTable, SavedAdTable } from "../../../../database/schema/client/contents/ads-schema.js";
import { mobilePhonesBookmarkValidator, mobilePhonesDelImageValidator, mobilePhonesEditValidator } from "../../../../validators/client/post-ads/electronics/mobile-phones-validator.js";
import { AvatarTable, UserTable } from "../../../../database/schema/client/user-schema.js";
import { defaultWhere } from "../../../../database/queries/client/categories/electronics/mobile-phones-queries.js";
import { SLUGS } from "../../post-ads/electronics/post-mobile-phones-route.js";
import { deleteImages, UploadToCloudinary } from "../../../../utils/universal/universal-functions.js";
import cloudinary from "../../../../utils/universal/cloudinary.js";
import { generateSlug } from "../../../../utils/universal/slug-generator.js";


const bookmarkWhereQuery = and(
   eq(SavedAdTable.sub_category, SLUGS.SUB),
   eq(SavedAdTable.main_category, SLUGS.MAIN)
);

const mobileCatalog = new Hono()

mobileCatalog.get("/mobile/bookmark/status/:id", async (c) => {
   const payload: Payload = c.get("jwtPayload");
   const id = c.req.param("id");

   if (payload?.role !== ROLE.USER || !payload?.userId) {
      throw new HTTPException(CODES.HTTP.UNAUTHORIZED_ACCESS, { message: "Unauthorized access" });
   }

   try {
      if (!id) {
         return c.json({ buyLater: false }, 200);
      }

      const getBuyLaterData = await db
         .select({
            savedId: SavedAdTable.saved_id,
         })
         .from(SavedAdTable)
         .where(
            and(
               bookmarkWhereQuery,
               eq(SavedAdTable.user_id, payload.userId),
               eq(SavedAdTable.slug, id)
            )
         );

      if (getBuyLaterData.length === 0 || !getBuyLaterData) {
         return c.json({ buyLater: false }, 200);
      }

      return c.json({ buyLater: true }, 200);
   } catch {
      return c.json({ buyLater: false }, 400);
   }
});






mobileCatalog.get("/mobile/bookmark/count/:id", async (c) => {
   const payload: Payload = c.get("jwtPayload");
   const id = c.req.param("id");

   if (payload?.role !== ROLE.USER || !payload?.userId) {
      throw new HTTPException(CODES.HTTP.UNAUTHORIZED_ACCESS, { message: "Unauthorized access" });
   }
   try {
      if (!id) {
         return c.json({ total: 0 }, 200);
      }

      const [{ total }] = await db
         .select({
            total: count(SavedAdTable.ads_id),
         })
         .from(SavedAdTable)
         .where(and(bookmarkWhereQuery, eq(SavedAdTable.slug, id)));

      return c.json({ total }, 200);
   } catch {
      return c.json({ total: 0 });
   }
});




mobileCatalog.post("/mobile/bookmark/ad", mobilePhonesBookmarkValidator, async (c) => {
   const payload: Payload = c.get("jwtPayload");
   const body = c.req.valid("json");
   const logger = c.get("logger");

   if (payload?.role !== ROLE.USER || !payload?.userId) {
      throw new HTTPException(CODES.HTTP.UNAUTHORIZED_ACCESS, { message: "Unauthorized access" });
   }

   const owner = await db
      .select({
         userId: UserTable.user_id,
      })
      .from(AdsTable)
      .innerJoin(UserTable, eq(UserTable.user_id, AdsTable.user_id))
      .where(and(defaultWhere, eq(AdsTable.ads_id, body.adsId)));

   if (owner.length === 0) {
      throw new HTTPException(CODES.HTTP.FORBIDDEN, {
         message: "We couldn't find the owner of the ad",
      });
   }
   if (owner[0].userId === payload.userId) {
      throw new HTTPException(CODES.HTTP.FORBIDDEN, { message: "You can't save your own ad" });
   }

   //check if users has added the items already
   const checkExistingBookmark = await db
      .select({
         savedId: SavedAdTable.saved_id,
      })
      .from(SavedAdTable)
      .where(
         and(
            bookmarkWhereQuery,
            eq(SavedAdTable.user_id, payload.userId),
            eq(SavedAdTable.ads_id, body.adsId)
         )
      );   

   if (checkExistingBookmark.length === 0) {
      const addToBookmark = await db
         .insert(SavedAdTable)
         .values({
            main_category: body.mainSlug,
            sub_category: body.subSlug,
            ads_id: body.adsId,
            slug: body.slug,
            owner_user_id: owner[0]?.userId,
            user_id: payload?.userId,
            title: body?.title,
            phone_primary: body?.phonePrimary,
            condition: body?.condition,
            location: body?.location,
            image_url: body?.imageUrl,
            price: body?.price,
         })
         .returning({ id: SavedAdTable.saved_id });

      if (addToBookmark.length > 0) {
         logger.info(
            {
               event: "bookmark_created",
               userId: payload.userId,
               adId: body.adsId,
            },
            "User bookmarked an ad"
         );
         return c.json({ message: "Ad bookmarked successfully" }, 200);
      } else {
         throw new HTTPException(CODES.HTTP.BAD_REQUEST, {
            message: "We couldn't save your ad, please retry",
         });
      }
   } else {
      const removeBookmark = await db
         .delete(SavedAdTable)
         .where(
            and(
               bookmarkWhereQuery,
               eq(SavedAdTable.user_id, payload.userId),
               eq(SavedAdTable.ads_id, body.adsId)
            )
         )
         .returning({ id: SavedAdTable.saved_id });
      if (removeBookmark.length > 0) {
          logger.info(
            {
               event: "bookmark_deleted",
               userId: payload.userId,
               adId: body.adsId,
            },
            "User removed a bookmark"
         );
         return c.json({ message: "Bookmark removed successfully" });
      } else {
         throw new HTTPException(CODES.HTTP.BAD_REQUEST, {
            message: "Something went wrong. Please retry",
         });
      }
   }
});


mobileCatalog.get("/mobile/phones/:id", async(c)=>{
   const id = c.req.param("id");
   const payload: Payload = c.get("jwtPayload");

   if (payload?.role !== ROLE.USER || !payload?.userId) {
      throw new HTTPException(CODES.HTTP.UNAUTHORIZED_ACCESS, { message: "Unauthorized access" });
   }

   if (!id.trim()) {
      throw new HTTPException(CODES.HTTP.NOT_FOUND, { message: "Ad not found" });
   }

   const onePhoneQuery = db
      .select({
         adsId: AdsTable.ads_id,
         region: AdsTable.region,
         town: AdsTable.town,
         description: AdsTable.description,
         title: AdsTable.title,
         images: AdsTable.images,
         slug: AdsTable.slug,
         mainSlug: AdsTable.main_slug,
         subSlug: AdsTable.sub_slug,
         color: sql<string>`${AdsTable.metadata}->>'color'`.as("color"),
         storage: sql<string>`${AdsTable.metadata}->>'storage'`.as("storage"),
         ram: sql<string>`${AdsTable.metadata}->>'ram'`.as("ram"),
         exchangePossible: sql<string>`${AdsTable.metadata}->>'exchange_possible'`.as(
            "exchange_possible"
         ),
         price: sql<number>`${AdsTable.metadata}->>'price'`.as("price"),
         brand: sql<string>`${AdsTable.metadata}->>'brand'`.as("brand"),
         model: sql<string>`${AdsTable.metadata}->>'model'`.as("model"),
         negotiable: sql<string>`${AdsTable.metadata}->>'negotiable'`.as("negotiable"),
         condition: sql<string>`${AdsTable.metadata}->>'condition'`.as("condition"),
         screenSize: sql<string>`${AdsTable.metadata}->>'screen_size'`.as("screen_size"),
         batterySize: sql<string>`${AdsTable.metadata}->>'battery_size'`.as("battery_size"),
         batteryHealth: sql<string>`${AdsTable.metadata}->'battery_health'`.as("battery_health"),
         accessories: sql<string[]>`${AdsTable.metadata}->'accessories'`.as("accessories"),
         createdAt: AdsTable.created_at,
         avatarImageUrl: AvatarTable.image_url,
         storeName: UserTable.store_name,
         fullName: UserTable.full_name,
         phonePrimary: UserTable.phone_primary,
         phoneSecondary: UserTable.phone_secondary,
         idVerified: UserTable.id_verified,
         userCreatedAt: UserTable.created_at,
      })
      .from(AdsTable)
      .innerJoin(UserTable, eq(UserTable.user_id, AdsTable.user_id))
      .leftJoin(AvatarTable, eq(AvatarTable.user_id, UserTable.user_id))
      .where(and(eq(AdsTable.ads_id, id),defaultWhere));


      const [onePhone] = await Promise.all([onePhoneQuery]);

      return c.json(onePhone[0], 200);
   

})



mobileCatalog.delete("/mobile/ads/:adId/del/image", mobilePhonesDelImageValidator, async (c) => {
   const payload: Payload = c.get("jwtPayload");
   const adId = c.req.param("adId");
   const logger = c.get("logger");
   const { imageUrl } = c.req.valid("json");
   if (payload?.role !== ROLE.USER || !payload?.userId) {
      throw new HTTPException(CODES.HTTP.UNAUTHORIZED_ACCESS, { message: "Unauthorized access" });
   }
   if (!adId.trim() || !imageUrl?.includes("https://res.cloudinary.com")) {
      throw new HTTPException(CODES.HTTP.NOT_FOUND, { message: "Ad not found" });
   }

   // Get images posted by the user
   const [{images}] = await db
      .select({images: AdsTable.images})
      .from(AdsTable)
      .where(
         and(
            eq(AdsTable.ads_id, adId),
            eq(AdsTable.sub_category, CATEGORIES.SUB.ELECTRONICS.MOBILE_PHONES),
            eq(AdsTable.user_id, payload.userId)
         )
      );
   
   if(images.length === 0){
      throw new HTTPException(CODES.HTTP.NOT_FOUND, { message: "Images not found" });
   }
   if(images.length <= 2){
      throw new HTTPException(CODES.HTTP.NOT_FOUND, { message: "At least 2 images are required for an ad." });
   }

   const filteredImageUrl = images.filter((idx)=> idx !== imageUrl);
   const splitted = [imageUrl].map((item: string) => item.split(/\/v\d+\//)[1].split("?")[0]);
   const results = await deleteImages(splitted);
   if (results.length === 0) {
      throw new HTTPException(CODES.HTTP.NOT_FOUND, { message: "No image found" });
   }
   await db.update(AdsTable)
   .set({images: filteredImageUrl})
   .where(
         and(
            eq(AdsTable.ads_id, adId),
            eq(AdsTable.sub_category, CATEGORIES.SUB.ELECTRONICS.MOBILE_PHONES),
            eq(AdsTable.user_id, payload.userId)
         )
      );

   logger.info(
     {
    event: "ad_image_deleted",
    userId: payload.userId,
    adId: adId,
    imageId: imageUrl,
    totalImagesCount: images.length,
  },
  "User deleted an image from an ad"
);   
    
   return c.json({ success: true, message: "Image removed successfully" });
});









mobileCatalog.put("/mobile/edit/:id", mobilePhonesEditValidator, async (c) => {
   const payload: Payload = c.get("jwtPayload");
   const body = c.req.valid("form");
   const logger = c.get("logger");
   const id = c.req.param("id");

   // 1. Security Check
   if (payload?.role !== ROLE.USER || !payload?.userId) {
      throw new HTTPException(CODES.HTTP.UNAUTHORIZED_ACCESS, { message: "Unauthorized access" });
   }

   // 2. Get the mixed array of (File | string)
   // formData.getAll() preserves the order you sent from the frontend
   const formData = await c.req.formData();
   const mixedImages = formData.getAll("images"); // Type: (string | File)[]

   // 3. Minimum Image Validation
   // We check the raw length (Files + Strings)
   if (mixedImages.length < 2) {
      throw new HTTPException(CODES.HTTP.CONFLICT, {
         message: "Advert must have at least 2 images",
      });
   }

   // 4. Process Images (Preserve Order)
   const processImagePromises = mixedImages.map(async (item) => {
      // CASE A: It is an existing URL (String)
      if (typeof item === "string") {
         return item;
      }

      // CASE B: It is a New Upload (File)
      if (item instanceof File) {
         const arrayBuffer = await item.arrayBuffer();
         const buffer = Buffer.from(arrayBuffer);

         // Upload to Cloudinary
         const uploadResult = (await UploadToCloudinary(
            buffer,
            "e-commerce/ads"
         )) as CloudinaryUploader;

         // Generate Optimized URL
         const optimizedUrl = cloudinary.url(uploadResult.public_id, {
            transformation: [
               { width: 1200, height: 1200, crop: "limit" },
               { quality: "auto", fetch_format: "auto" },
            ],
            secure: true,
         });

         return optimizedUrl;
      }

      // Fallback (Should never happen if validator works)
      throw new Error("Invalid image data received");
   });

   // Wait for all uploads to finish
   // finalImageUrls will be exactly ordered: e.g., [ "old_url", "new_url", "old_url" ]
   const finalImageUrls = await Promise.all(processImagePromises);

   // 5. Prepare DB Update Object
   // Merge the text fields from 'body' with our new 'finalImageUrls'

   let finalDataToUpdate;
   let newSlug;
   try {
      // 6. Perform DB Update (Example using generic DB call)
      const [{ title, brand, model, batterySize, screenSize }] = await db
         .select({
            title: AdsTable.title,
            brand: sql<string>`${AdsTable.metadata}->>'brand'`.as("brand"),
            model: sql<string>`${AdsTable.metadata}->>'model'`.as("model"),
            batterySize: sql<string>`${AdsTable.metadata}->>'battery_size'`.as("battery_size"),
            screenSize: sql<string>`${AdsTable.metadata}->>'screen_size'`.as("screen_size"),
         })
         .from(AdsTable)
         .where(
            and(
               or(eq(AdsTable.ads_id, id),eq(AdsTable.slug, id)),
               eq(AdsTable.sub_category, CATEGORIES.SUB.ELECTRONICS.MOBILE_PHONES),
               eq(AdsTable.user_id, payload.userId)
            )
         );

      const updateData = {
         region: body.region,
         town: body.town,
         title: body.title,
         description: body.description,
         metadata: {
            brand: brand,
            model: model,
            storage: body.storage,
            ram: body.ram,
            color: body.color,
            battery_size: batterySize,
            battery_health: body.batteryHealth ? Number(body.batteryHealth) : null,
            screen_size: screenSize,
            condition: body.condition,
            negotiable: body.negotiable,
            exchange_possible: body.exchangePossible,
            accessories: body?.accessories ?? null,
            price: body.price,
         },
         images: finalImageUrls, // The sorted, mixed array
         updatedAt: new Date(),
      };

      if (title !== body.title) {
         const slug = generateSlug(body.title);

         await db
            .update(SavedAdTable)
            .set({ slug: slug, title: body.title })
            .where(
               and(eq(SavedAdTable.title, title), eq(SavedAdTable.owner_user_id, payload.userId))
            );

         finalDataToUpdate = { ...updateData, slug: slug };
         newSlug = slug;
      } else {
         finalDataToUpdate = { ...updateData };
      }

      await db
         .update(AdsTable)
         .set(finalDataToUpdate)
         .where(
            and(
               or(eq(AdsTable.ads_id, id),eq(AdsTable.slug, id)),
               eq(AdsTable.sub_category, CATEGORIES.SUB.ELECTRONICS.MOBILE_PHONES),
               eq(AdsTable.user_id, payload.userId)
            )
         );

      logger.info(
         {
            adId: id,
            userId: payload.userId,
            updatedFields: Object.keys(updateData),
         },
         "Mobile phone ad updated successfully"
      );

      return c.json({
         success: true,
         message: "Ad updated successfully",
         data: { newSlug: newSlug ?? "" },
      });
   } catch (error) {
      logger.error(
         {
            err: error,
            adId: id,
            userId: payload.userId,
         },
         "Failed to update mobile phone ad"
      );
      throw new HTTPException(CODES.HTTP.INTERNAL_SERVER_ERROR, { message: "Failed to update ad" });
   }
});










export default mobileCatalog;