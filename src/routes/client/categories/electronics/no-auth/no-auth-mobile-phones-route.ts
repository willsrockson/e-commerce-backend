import { Hono } from "hono";
import { and, eq, gte, lte, ne, sql, desc, count, or, ilike } from "drizzle-orm";
import { db } from "../../../../../database/connection.js";
import { 
    mobilePhonesQuery ,
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

} from "../../../../../database/queries/client/categories/electronics/mobile-phones-queries.js";
import { SavedAdTable, AdsTable } from "../../../../../database/schema/client/contents/ads-schema.js";
import { UserTable, AvatarTable } from "../../../../../database/schema/client/user-schema.js";
import { HTTPException } from "hono/http-exception";
import { CODES } from "../../../../../config/constants.js";

//const main_category = 'electronics';
//const sub_category = 'mobilephones';

interface Bookmark{
  ads_id: string;
  title: string; 
  phone_primary: string; 
  condition: string; 
  image_url:string; 
  price: number; 
  location: string;
}




interface IQueryType{
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
  id_verified?: string;
  q?:string;
}

const mobilePhonesNoAuthCatalog = new Hono()


mobilePhonesNoAuthCatalog.get("/mobile/phones", async(c)=>{
    const page = Number(c.req.query("page")) || 1;
    const limit = Number(c.req.query("limit")) || 20;
    const offset = (page - 1) * limit;

    const query = c.req.query() as IQueryType;
   
   
   function cleanPrice(price: string ):number {
      if(!price) return 0
      let cleaned = price.replace(/,/g, "");
      return Number(cleaned);
   }
    
  function buildFilters(query: IQueryType, wanted: (keyof IQueryType)[]) {
        const conditions = [];

        if (wanted.includes('q') && query.q) {
            const fuzzyMatch = or(
                ilike(AdsTable.title, `%${query.q}%`),
                ilike(AdsTable.description, `%${query.q}%`),
                ilike(AdsTable.main_category, `%${query.q}%`),
                ilike(AdsTable.sub_category, `%${query.q}%`)
            );

            const fullTextSearch = sql`
                to_tsvector('english', 
                    coalesce(${AdsTable.title}, '') || ' ' || 
                    coalesce(${AdsTable.description}, '') || ' ' || 
                    coalesce(${AdsTable.main_category}, '') || ' ' || 
                    coalesce(${AdsTable.sub_category}, '')
                )
                @@ plainto_tsquery('english', ${query.q})
            `;

            conditions.push(or(fuzzyMatch, fullTextSearch));
        }

        if (wanted.includes('region') && query.region) {
            conditions.push(eq(AdsTable.region, query.region));
        }
        if (wanted.includes('town') && query.town) {
            conditions.push(eq(AdsTable.town, query.town));
        }
        if(wanted.includes('brand') && query.brand){
          conditions.push(eq(sql`${AdsTable.metadata}->>'brand'`, query.brand));
        }
        if(wanted.includes('model') && query.model){
           conditions.push(eq(sql`${AdsTable.metadata}->>'model'`, query.model));
        }
         if(wanted.includes('condition') && query.condition){
           conditions.push(eq(sql`${AdsTable.metadata}->>'condition'`, query.condition));
        }
        if(wanted.includes('price_min') && query.price_min){
          conditions.push(gte(sql`(${AdsTable.metadata}->>'price')::int`, cleanPrice(query.price_min)));
        }
        if(wanted.includes('price_max') && query.price_max){
          conditions.push(lte(sql`(${AdsTable.metadata}->>'price')::int`, cleanPrice(query.price_max)));
        }
        if(wanted.includes('storage') && query.storage){
          conditions.push(eq(sql`${AdsTable.metadata}->>'storage'`, query.storage));
        }
        if(wanted.includes('color') && query.color){
          conditions.push(eq(sql`${AdsTable.metadata}->>'color'`, query.color));
        }
        if(wanted.includes('ram') && query.ram){
          conditions.push(eq(sql`${AdsTable.metadata}->>'ram'`, query.ram));
        }
        if(wanted.includes('screen_size') && query.screen_size){
          conditions.push(eq(sql`${AdsTable.metadata}->>'screen_size'`, query.screen_size));
        }
        if(wanted.includes('exchange_possible') && query.exchange_possible){
          conditions.push(eq(sql`${AdsTable.metadata}->>'exchange_possible'`, query.exchange_possible));
        }
        if(wanted.includes('negotiable') && query.negotiable){
          conditions.push(eq(sql`${AdsTable.metadata}->>'negotiable'`, query.negotiable));
        }
        if(wanted.includes('id_verified') && query.id_verified){
          conditions.push(eq(sql`${UserTable.id_verified}::text`, query.id_verified));
        }

        return conditions.length > 0 ? and(...conditions) : undefined;
    }

   
     try {
                  
          const allFilters = buildFilters(query, ["region", "town", "brand", "model", 'condition', 'price_min', 'price_max', "ram", "storage", "color", "screen_size", "exchange_possible", "negotiable","id_verified","q"]);
          const regionFilters = buildFilters(query, ["brand", "model", "condition", "price_min", 'price_max', "ram", "storage", "color", "screen_size", "exchange_possible", "negotiable", "id_verified","q"]);
          const townFilters = buildFilters(query, ["brand", "model", "condition", "price_min", 'price_max', "ram", "storage", "color", "screen_size", "exchange_possible", "negotiable", "id_verified","q"]);
          const brandFilters = buildFilters(query, ["region", "town", "condition", "price_min", 'price_max', "ram", "storage", "color", "screen_size", "exchange_possible", "negotiable", "id_verified","q"]);
          const modelFilters = buildFilters(query, ["region", "town", "brand", "condition", "price_min", 'price_max', "ram", "storage", "color", "screen_size", "exchange_possible", "negotiable", "id_verified","q"]);
          const conditionFilters = buildFilters(query, ["region", "town", "brand", "model", "price_min", 'price_max', "ram", "storage", "color", "screen_size", "exchange_possible", "negotiable", "id_verified","q"]);
          const storageFilters = buildFilters(query, ["region", "town", "brand", "model", 'condition', 'price_min', 'price_max', "ram", "color", "screen_size", "exchange_possible", "negotiable", "id_verified","q"]);
          const ramFilters = buildFilters(query, ["region", "town", "brand", "model", 'condition', 'price_min', 'price_max', "storage", "color", "screen_size", "exchange_possible", "negotiable", "id_verified","q"]);
          const colorFilters = buildFilters(query, ["region", "town", "brand", "model", 'condition', 'price_min', 'price_max', "storage", "screen_size", "exchange_possible", "negotiable", "id_verified", "q"]);
          const screenSizeFilters = buildFilters(query, ["region", "town", "brand", "model", 'condition', 'price_min', 'price_max', "ram", "storage", "color", "exchange_possible", "negotiable", "id_verified", "q"]);
          const exchangePossibleFilters = buildFilters(query, ["region", "town", "brand", "model", 'condition', 'price_min', 'price_max', "ram", "storage", "color", "screen_size", "negotiable", "id_verified", "q"]);
          const negotiableFilters = buildFilters(query, ["region", "town", "brand", "model", 'condition', 'price_min', 'price_max', "ram", "storage", "color", "screen_size", "exchange_possible", "id_verified", "q"]);
          const verifiedSellerFilters = buildFilters(query, ["region", "town", "brand", "model", 'condition', 'price_min', 'price_max', "ram", "storage", "color", "screen_size", "exchange_possible", "negotiable", "q"]);






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
        
        return c.json({
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
         }, 200);

      
     } catch {
        return c.json([], 200)
     }

   
})



/* 
 Get each phone by it's slug
*/
mobilePhonesNoAuthCatalog.get("/mobile/phones/:id", async (c) => {
   const page = Number(c.req.query("page")) || 1;
   const limit = Number(c.req.query("limit")) || 20;
   const offset = (page - 1) * limit;
   const id = c.req.param("id");

   if (!id.trim()) {
      throw new HTTPException(CODES.HTTP.NOT_FOUND, { message: "Ad not found" });
   }

   const onePhoneQuery = await db
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
         storeNameSlug: UserTable.store_name_slug,
         openHours: UserTable.open_hours,
         phoneSecondary: UserTable.phone_secondary,
         idVerified: UserTable.id_verified,
         userCreatedAt: UserTable.created_at,
      })
      .from(AdsTable)
      .innerJoin(UserTable, eq(UserTable.user_id, AdsTable.user_id))
      .leftJoin(AvatarTable, eq(AvatarTable.user_id, UserTable.user_id))
      .where(and(eq(AdsTable.slug, id),defaultWhere));

   const relatedListingQuery = await db
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
      .where(
         and(
            ne(AdsTable.slug, id),
            defaultWhere,
            eq(sql`${AdsTable.metadata}->>'model'`, onePhoneQuery[0]?.model)
         )
      )
      .orderBy(desc(AdsTable.updated_at))
      .offset(offset ?? 0)
      .limit(limit ?? 0);

   const countRelatedListingQuery = await db
      .select({
         mobile_count: count(AdsTable.ads_id).as("mobile_count"),
      })
      .from(AdsTable)
      .innerJoin(UserTable, eq(UserTable.user_id, AdsTable.user_id))
      .where(
         and(
            defaultWhere,
            ne(AdsTable.slug, id),
            eq(sql`${AdsTable.metadata}->>'model'`, onePhoneQuery[0]?.model)
         )
      );

   const [onePhone, relatedListing, countRelatedListing] = await Promise.all([
      onePhoneQuery,
      relatedListingQuery,
      countRelatedListingQuery,
   ]);

   if (onePhone.length === 0) {
      throw new HTTPException(CODES.HTTP.NOT_FOUND, { message: "Phone not found" });
   }
   const total = countRelatedListing[0].mobile_count;

   return c.json(
      {
         onePhone,
         relatedListing,
         total,
         hasMore: offset + relatedListing.length < total,
         page: page,
      },
      200
   );
});


export default mobilePhonesNoAuthCatalog;