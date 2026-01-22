import { Hono } from "hono";
import { desc, ilike } from "drizzle-orm";
import { SearchTermsTable } from "../../../database/schema/client/search-terms-schema.js";
import { db } from "../../../database/connection.js";

const suggestionsRoute = new Hono();

suggestionsRoute.get("/suggestions", async (c) => {
    const q = c.req.query("q") || "";

    // 1. Validation: Don't search for single letters (too noisy)
    if (q.length < 2) return c.json([]); 

    try {
        const suggestions = await db
            .select({ term: SearchTermsTable.term })
            .from(SearchTermsTable)
            // 2. Speed: "ilike 'term%'" hits the database index efficiently
            .where(ilike(SearchTermsTable.term, `${q}%`)) 
            // 3. Smart: Show most popular terms first
            .orderBy(desc(SearchTermsTable.count)) 
            .limit(6); // Keep list short

        // Return just the array of strings ["iphone 11", "iphone 12"]
        return c.json(suggestions.map(s => s.term));
        
    } catch (error) {
        console.error("Suggestion Error:", error);
        return c.json([]);
    }
});

export default suggestionsRoute;