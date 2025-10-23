import { sql } from "drizzle-orm";
import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { subCategoryTable } from "../categories";

const timestamps = {
  updated_at: timestamp().defaultNow().notNull(),
  created_at: timestamp().defaultNow().notNull()
}

export const mobilePhoneTable = pgTable("mobile_phones", {
  mobile_id: serial("mobile_id").primaryKey(),
  brand: text('brand').notNull(),
  model: text('model').notNull().unique(), // This must be unique
  storage: text('storage').array().notNull().default(sql`ARRAY[]::text[]`),
  ram: text('ram').array().notNull().default(sql`ARRAY[]::text[]`),
  colors: text('colors').array().notNull().default(sql`ARRAY[]::text[]`),
  battery_size: text('battery_size').notNull(),
  screen_size: text('screen_size').notNull(),
  sub_category_id: integer('sub_category_id').references(()=> subCategoryTable.sub_category_id, {onDelete: 'cascade'} ).notNull(),
  ...timestamps
});

export const mobilePhoneGeneral = pgTable("mobile_phones_general", {
    mobile_general_id: serial("mobile_general_id").primaryKey(),
    conditions: text('conditions').array().notNull().default(sql`ARRAY[]::text[]`),
    negotiable: text('negotiable').array().notNull().default(sql`ARRAY[]::text[]`),
    exchange_possible: text('exchange_possible').array().notNull().default(sql`ARRAY[]::text[]`),
    accessories: text('accessories').array().notNull().default(sql`ARRAY[]::text[]`),
    verification_status: text("verification_status").array().notNull().default(sql`ARRAY['Verified', 'Not Verified']::text[]`),
    sub_category_id: integer('sub_category_id').references(()=> subCategoryTable.sub_category_id, {onDelete: 'cascade'} ).notNull(),
    ...timestamps
});