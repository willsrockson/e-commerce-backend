import { pgTable, serial, text, integer, timestamp, PgTable, } from "drizzle-orm/pg-core";

const timestamps = {
  updated_at: timestamp().defaultNow().notNull(),
  created_at: timestamp().defaultNow().notNull()
}

// mainCategory table
export const mainCategoryTable = pgTable("main_category", {
  main_category_id: serial("main_category_id").primaryKey(),
  main_name: text("main_name").notNull().unique(),
  ...timestamps
});

export const subCategoryTable = pgTable("sub_category",{
   sub_category_id: serial('sub_category_id').primaryKey(),
   sub_name: text("sub_name").notNull().unique(),
   main_category_id: integer("main_category_id").references(()=> mainCategoryTable.main_category_id, {onDelete: "cascade"}).notNull(),
   ...timestamps
});