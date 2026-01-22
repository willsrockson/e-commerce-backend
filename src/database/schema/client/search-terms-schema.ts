import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";

export const SearchTermsTable = pgTable("search_terms", {
  // The search word (stored in lowercase, e.g., "iphone")
  term: text("term").primaryKey(), 
  
  // How many times people searched for it
  count: integer("count").default(1).notNull(),
  
  // To track trends (optional, but good for cleanup later)
  updatedAt: timestamp("updated_at").defaultNow(),
});