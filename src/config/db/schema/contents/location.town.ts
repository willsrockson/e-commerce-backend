import { pgTable, serial, text, integer, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

const timestamps = {
  updated_at: timestamp().defaultNow().notNull(),
  created_at: timestamp().defaultNow().notNull()
}

// Location table
export const locationTable = pgTable("location", {
  location_id: serial("location_id").primaryKey(),
  country: text("country").notNull(),
  region: text("region").notNull(),
  ...timestamps
});

// Town table
export const townTable = pgTable("town", {
  town_id: serial("town_id").primaryKey(),
  location_id: integer("location_id").references(() => locationTable.location_id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  ...timestamps
},
 (table) => {
    return {
      // 👇 Enforce uniqueness of town names *per region*
      uniqueTownPerRegion: uniqueIndex("unique_town_per_region").on(
        table.location_id,
        table.name
      ),
    };
  }
);


// Relations
export const locationRelations = relations(locationTable, ({ many }) => ({
  towns: many(townTable),
}));

export const townRelations = relations(townTable, ({ one }) => ({
  location: one(locationTable, {
    fields: [townTable.location_id],
    references: [locationTable.location_id],
  }),
}));
