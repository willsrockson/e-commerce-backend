import { pgTable, serial, text, integer, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

const timestamps = {
  updated_at: timestamp().defaultNow().notNull(),
  created_at: timestamp().defaultNow().notNull()
}

// Location table
export const RegionTable = pgTable("region", {
  region_id: serial("region_id").primaryKey(),
  country: text("country").notNull().default("Ghana"),
  name: text("name").notNull().unique(),
  ...timestamps
});

// Town table
export const TownTable = pgTable("town", {
  town_id: serial("town_id").primaryKey(),
  region_id: integer("region_id").references(() => RegionTable.region_id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  ...timestamps
},
 (table) => {
    return {
      // 👇 Enforce uniqueness of town names *per region*
      uniqueTownPerRegion: uniqueIndex("unique_town_per_region").on(
        table.region_id,
        table.name
      ),
    };
  }
);


// Relations
export const RegionRelations = relations(RegionTable, ({ many }) => ({
  towns: many(TownTable),
}));

export const TownRelations = relations(TownTable, ({ one }) => ({
  region: one(RegionTable, {
    fields: [TownTable.region_id],
    references: [RegionTable.region_id],
  }),
}));
