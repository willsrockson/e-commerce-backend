import { Hono } from "hono";
import { db } from "../../database/connection.js";
import { RegionTable, TownTable } from "../../database/schema/client/contents/region-town-schema.js";
import { sql, eq } from "drizzle-orm";

const regionTown = new Hono();

regionTown.get("/region/town", async (c) => {
   const getRegionTown = await db
      .select({
         region: RegionTable.name,
         town: sql<string[]>`array_agg(${TownTable.name})`,
      })
      .from(RegionTable)
      .innerJoin(TownTable, eq(TownTable.region_id, RegionTable.region_id))
      .groupBy(RegionTable.name);

   return c.json(getRegionTown, 200);
});

export default regionTown;
