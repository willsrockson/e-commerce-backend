import { Hono } from "hono";
import { db } from "../../../../database/connection.js";
import {
   MobilePhoneTable,
   MobilePhoneGeneral,
} from "../../../../database/schema/client/contents/electronics/mobile-phones-schema.js";
import { eq, sql } from "drizzle-orm";

const contentMobilePhones = new Hono();

contentMobilePhones.get("/mobile/brand", async (c) => {
   const brands = await db
      .select({
         brand: MobilePhoneTable.brand,
      })
      .from(MobilePhoneTable)
      .groupBy(MobilePhoneTable.brand);

   return c.json(brands, 200);
});

contentMobilePhones.get("/mobile/model/:brand", async (c) => {
   const brand = c.req.param("brand");

   if (!brand.trim()) {
      return;
   }

   const model = await db
      .select({
         brand: MobilePhoneTable.brand,
         models: sql<any>`json_agg( json_build_object(
                     'model', ${MobilePhoneTable.model},
                     'storages', ${MobilePhoneTable.storage},
                     'colors', ${MobilePhoneTable.colors},
                     'screen_size', ${MobilePhoneTable.screen_size},
                     'battery_size', ${MobilePhoneTable.battery_size},
                     'ram', ${MobilePhoneTable.ram}
                     ) ORDER BY ${MobilePhoneTable.model}
                )`,
      })
      .from(MobilePhoneTable)
      .where(eq(MobilePhoneTable.brand, brand))
      .groupBy(MobilePhoneTable.brand);

   return c.json(model, 200);
});

contentMobilePhones.get("/mobile/general", async (c) => {
   const mobileGeneral = await db
      .select({
         conditions: MobilePhoneGeneral.conditions,
         negotiable: MobilePhoneGeneral.negotiable,
         exchange_possible: MobilePhoneGeneral.exchange_possible,
         accessories: MobilePhoneGeneral.accessories,
      })
      .from(MobilePhoneGeneral);

   return c.json(mobileGeneral, 200);
});

export default contentMobilePhones;
