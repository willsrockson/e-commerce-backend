import { pgTable, serial, text, integer, timestamp, unique } from "drizzle-orm/pg-core";

const timestamps = {
  updated_at: timestamp().defaultNow().notNull(),
  created_at: timestamp().defaultNow().notNull()
}

// mainCategory table
export const MainCategoryTable = pgTable("main_category", {
  main_category_id: serial("main_category_id").primaryKey(),
  main_name: text("main_name").notNull().unique(),
  main_slug: text("main_slug").notNull().unique(),
  ...timestamps
});

export const SubCategoryTable = pgTable("sub_category",{
   sub_category_id: serial('sub_category_id').primaryKey(),
   sub_name: text("sub_name").notNull(),
   sub_slug: text("sub_slug").notNull().unique(),
   main_category_id: integer("main_category_id").references(()=> MainCategoryTable.main_category_id, {onDelete: "cascade"}).notNull(),
   ...timestamps
},(table)=>({
// 3. Allow "Accessories" in multiple categories
   uniquePerParent: unique().on(table.sub_name, table.main_category_id)
}));