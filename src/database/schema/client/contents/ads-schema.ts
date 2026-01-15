import { sql } from "drizzle-orm";
import { pgTable, text, integer, timestamp, boolean, uuid, jsonb, index, unique, } from "drizzle-orm/pg-core";
import { UserTable } from "../user-schema.js";

const timestamps = {
  updated_at: timestamp().defaultNow().notNull(),
  created_at: timestamp().defaultNow().notNull()
}


export const AdsTable = pgTable("ads", {
  ads_id: uuid('ads_id').primaryKey().defaultRandom(),
  region: text('region').notNull(),
  town: text('town').notNull(),
  slug: text("slug").notNull().unique(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  main_category: text('main_category').notNull(),
  main_slug: text('main_slug').notNull(),
  sub_category: text('sub_category').notNull(),
  sub_slug: text('sub_slug').notNull(),
  images: text('images').array().notNull().default(sql`ARRAY[]::text[]`),
  deactivated: boolean('deactivated').notNull().default(false),
  metadata: jsonb('metadata').notNull(),
  user_id: uuid("user_id").notNull().references(()=> UserTable.user_id, { onDelete: "cascade"}),
  ...timestamps
});



export const SavedAdTable = pgTable(
  "saved_ads",
  {
    saved_id: uuid("saved_id").primaryKey().defaultRandom(),
    main_category: text("main_category").notNull(),
    sub_category: text("sub_category").notNull(),
    ads_id: uuid("ads_id")
      .references(() => AdsTable.ads_id, { onDelete: "set null" }),

    slug: text("slug").notNull(),
    
    owner_user_id: uuid("owner_user_id")
      .notNull()
      .references(() => UserTable.user_id, { onDelete: "cascade" }),

    user_id: uuid("user_id")
      .notNull()
      .references(() => UserTable.user_id, { onDelete: "cascade" }),

    title: text("title").notNull(),
    phone_primary: text('phone_primary').notNull(),
    condition: text('condition'),
    image_url: text("image_url").notNull(),
    price: integer("price"),
    location: text("location").notNull(),
    ...timestamps
  },
  (table) => ({
    userAdUnique: unique().on(table.user_id, table.ads_id),
    idxUser: index("idx_saved_ads_user").on(table.user_id),
    idxOwner: index("idx_saved_ads_owner").on(table.owner_user_id),
  })
);

