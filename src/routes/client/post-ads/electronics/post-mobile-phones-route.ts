import { Hono } from "hono";
import { mobilePhonesPostingValidator } from "../../../../validators/client/post-ads/electronics/mobile-phones-validator.js";
import type { CloudinaryUploader, Payload } from "../../../../types/client/types.js";
import { CODES, ROLE } from "../../../../config/constants.js";
import { HTTPException } from "hono/http-exception";
import { db } from "../../../../database/connection.js";
import { AdsTable } from "../../../../database/schema/client/contents/ads-schema.js";
import { generateSlug } from "../../../../utils/universal/slug-generator.js";
import { UploadToCloudinary } from "../../../../utils/universal/universal-functions.js";
import cloudinary from "../../../../utils/universal/cloudinary.js";

export const SLUGS = {
   MAIN: "electronics",
   SUB: "mobile-phones"
}

const postMobilePhones = new Hono()


postMobilePhones.post("/mobile/phones", mobilePhonesPostingValidator, async (c) => {
   const payload: Payload = c.get("jwtPayload");

   const data = c.req.valid("form");

   const formData = await c.req.formData();
   const files = formData.getAll("adImages");

   const logger = c.get("logger");

   if (payload?.role !== ROLE.USER || !payload?.userId) {
      throw new HTTPException(CODES.HTTP.UNAUTHORIZED_ACCESS, { message: "Unauthorized access" });
   }

   if (files.length === 0) {
      throw new HTTPException(CODES.HTTP.BAD_REQUEST, { message: "Images aren't available" });
   }
   if (files.length < 2 || files.length > 7) {
      throw new HTTPException(CODES.HTTP.BAD_REQUEST, {
         message: "Images must be between 2 and 7",
      });
   }

   // 3. Parallel Uploads (Your existing logic)
   const uploadPromises = files.map(async (file) => {
      // You usually need to cast 'file' to 'File' to satisfy TS
      const f = file as File;
      const arrayBuffer = await f.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      return UploadToCloudinary(buffer, "e-commerce/ads");
   });

   const results = (await Promise.all(uploadPromises)) as CloudinaryUploader[];

   const publicIds = results.map((res) => res.public_id);

   const publicIdPromises = publicIds.map(async (pIds) => {
      const optimizedImageUrl = cloudinary.url(pIds, {
         transformation: [
            {
               width: 1200,
               height: 1200,
               crop: "limit",
            },
            {
               quality: "auto",
               fetch_format: "auto",
            },
         ],
         secure: true,
      });
      return optimizedImageUrl;
   });

   const urls = await Promise.all(publicIdPromises);

   if (urls.length === 0) {
      throw new HTTPException(CODES.HTTP.BAD_REQUEST, { message: "Images upload failed." });
   }

   // Post for Mobilephones
   const slug = generateSlug(data.title);
   const listPhone = await db
      .insert(AdsTable)
      .values({
         region: data.region,
         town: data.town,
         title: data.title,
         description: data.description,
         main_category: data.mainCategory,
         main_slug: SLUGS.MAIN,
         sub_category: data.subCategory,
         sub_slug: SLUGS.SUB,
         slug: slug,
         images: urls,
         metadata: {
            brand: data.brand,
            model: data.model,
            storage: data.storage,
            ram: data.ram,
            color: data.color,
            battery_size: data.batterySize,
            battery_health: data?.batteryHealth ?? null,
            screen_size: data.screenSize,
            condition: data.condition,
            negotiable: data.negotiable,
            exchange_possible: data.exchangePossible,
            accessories: data?.accessories ?? null,
            price: data.price,
         },
         user_id: payload.userId,
      })
      .returning({ adsId: AdsTable.ads_id });

   if (listPhone.length === 0) {
      throw new Error("We couldn't publish your ad. Please check your connection and try again.");
   }
   logger.info(
      `UserId: ${payload.userId} listed an item(Mobile Phones) with the ID:${listPhone[0].adsId}`
   );
   return c.json(
      { success: true, message: "Success! Your ad is being reviewed and will be live shortly." },
      200
   );
});











export default postMobilePhones;

