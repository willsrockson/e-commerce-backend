import { Hono } from "hono";
import { db } from "../../database/connection.js";
import {
   MainCategoryTable,
   SubCategoryTable,
} from "../../database/schema/client/contents/categories-schema.js";
import { sql, eq } from "drizzle-orm";

const categories = new Hono();

categories.get("/categories", async (c) => {
   const getCategories = await db
      .select({
         mainName: MainCategoryTable.main_name,
         subCategories: sql`json_agg(${SubCategoryTable.sub_name})`,
      })
      .from(MainCategoryTable)
      .innerJoin(
         SubCategoryTable,
         eq(SubCategoryTable.main_category_id, MainCategoryTable.main_category_id)
      )
      .groupBy(MainCategoryTable.main_name);

      return c.json(getCategories, 200)
});

export default categories;
