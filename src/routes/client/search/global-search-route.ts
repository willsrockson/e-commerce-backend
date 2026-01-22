import { Hono } from "hono";
import { ilike, or, and, eq, sql, desc, gte, lte, count } from "drizzle-orm";
import { AdsTable } from "../../../database/schema/client/contents/ads-schema.js";
import { UserTable } from "../../../database/schema/client/user-schema.js";
import { db } from "../../../database/connection.js";
import { SearchTermsTable } from "../../../database/schema/client/search-terms-schema.js";

export interface ISearchFormData {
  q?: string;           
  category?: string;
  region?: string;
  town?: string;
  condition?: string;
  priceMin?: string;
  priceMax?: string;
  negotiable?: string;
  idVerified?: string;
}

const globalSearchCatalog = new Hono();

globalSearchCatalog.get("/global-search", async (c) => {
    const page = Number(c.req.query("page")) || 1;
    const limit = Number(c.req.query("limit")) || 20;
    const offset = (page - 1) * limit;
    const q = c.req.query("q") || "";
    const logger = c.get("logger"); 

    const query = c.req.query() as unknown as ISearchFormData; 

    function cleanPrice(price: string): number {
        if (!price) return 0;
        let cleaned = price.replace(/,/g, "");
        return Number(cleaned);
    }

    function buildFilters(query: any, wanted: string[]) {
        const conditions = [];

        // --- SEARCH LOGIC ---
        if (q) {
            const fuzzyMatch = or(
                ilike(AdsTable.title, `%${q}%`),
                ilike(AdsTable.description, `%${q}%`),
                ilike(AdsTable.main_category, `%${q}%`),
                ilike(AdsTable.sub_category, `%${q}%`)
            );

            const fullTextSearch = sql`
                to_tsvector('english', 
                    coalesce(${AdsTable.title}, '') || ' ' || 
                    coalesce(${AdsTable.description}, '') || ' ' || 
                    coalesce(${AdsTable.main_category}, '') || ' ' || 
                    coalesce(${AdsTable.sub_category}, '')
                )
                @@ plainto_tsquery('english', ${q})
            `;

            conditions.push(or(fuzzyMatch, fullTextSearch));
        }

        // --- STANDARD FILTERS ---
        if (wanted.includes('category') && query.category) {
             // 🔴 CHANGED: Filter by 'sub_slug' now, not main_slug
             // This ensures if user clicks "iPhones", we search sub_slug="iphones"
            conditions.push(eq(AdsTable.sub_slug, query.category));
        }
        if (wanted.includes('region') && query.region) {
            conditions.push(eq(AdsTable.region, query.region));
        }
        if (wanted.includes('town') && query.town) {
            conditions.push(eq(AdsTable.town, query.town));
        }
        if (wanted.includes('condition') && query.condition) {
            conditions.push(eq(sql`${AdsTable.metadata}->>'condition'`, query.condition));
        }
        if (wanted.includes('price_min') && query.price_min) {
            conditions.push(gte(sql`(${AdsTable.metadata}->>'price')::int`, cleanPrice(query.price_min)));
        }
        if (wanted.includes('price_max') && query.price_max) {
            conditions.push(lte(sql`(${AdsTable.metadata}->>'price')::int`, cleanPrice(query.price_max)));
        }
        if (wanted.includes('negotiable') && query.negotiable) {
            conditions.push(eq(sql`${AdsTable.metadata}->>'negotiable'`, query.negotiable));
        }
        if (wanted.includes('id_verified') && query.id_verified) {
            conditions.push(eq(sql`${UserTable.id_verified}::text`, query.id_verified));
        }

        conditions.push(eq(AdsTable.deactivated, false));

        return conditions.length > 0 ? and(...conditions) : undefined;
    }

    if (q && q.length > 2) {
        const cleanTerm = q.toLowerCase().trim();

        // Fire and forget (don't await) to keep search fast
        db.insert(SearchTermsTable)
          .values({ term: cleanTerm, count: 1 })
          .onConflictDoUpdate({
            target: SearchTermsTable.term,
            set: {
              count: sql`${SearchTermsTable.count} + 1`, // Increment count
              updatedAt: new Date(),
            },
          })
          .then(() => logger.info(` tracked: ${cleanTerm}`))
          .catch((err) => logger.error("Tracking failed", err));
    }

    try {
        const allFilters = buildFilters(query, ["category", "region", "town", "condition", "price_min", "price_max", "negotiable", "id_verified"]);
        
        const categoryFilters = buildFilters(query, [/* "category" excluded */ "region", "town", "condition", "price_min", "price_max", "negotiable", "id_verified"]);
        const regionFilters = buildFilters(query, ["category", /* "region" excluded */ "town", "condition", "price_min", "price_max", "negotiable", "id_verified"]);
        const townFilters = buildFilters(query, ["category", "region", /* "town" excluded */ "condition", "price_min", "price_max", "negotiable", "id_verified"]);
        const conditionFilters = buildFilters(query, ["category", "region", "town", /* "condition" excluded */ "price_min", "price_max", "negotiable", "id_verified"]);
        const negotiableFilters = buildFilters(query, ["category", "region", "town", "condition", "price_min", "price_max", /* "negotiable" excluded */ "id_verified"]);
        const verifiedSellerFilters = buildFilters(query, ["category", "region", "town", "condition", "price_min", "price_max", "negotiable" /* "id_verified" excluded */]);


        const [
            items, 
            totalCount, 
            countCategory,
            countRegion, 
            countTown, 
            countCondition, 
            countNegotiable, 
            countVerifiedSellers
        ] = await Promise.all([
            
            // A. Main Items
            db.select({
                adsId: AdsTable.ads_id,
                firstImage: sql<string>`${AdsTable.images}[1]`.as("first_image"),
                price: sql<number>`(${AdsTable.metadata}->>'price')::int`,
                title: AdsTable.title,
                region: AdsTable.region,
                town: AdsTable.town,
                condition: sql<string>`${AdsTable.metadata}->>'condition'`,
                createdAt: AdsTable.created_at,
                description: AdsTable.description,
                idVerified: UserTable.id_verified,
                slug: AdsTable.slug,
                mainSlug: AdsTable.main_slug,
                subSlug: AdsTable.sub_slug,
            })
            .from(AdsTable)
            .leftJoin(UserTable, eq(AdsTable.user_id, UserTable.user_id))
            .where(allFilters)
            .orderBy(desc(AdsTable.created_at))
            .limit(limit)
            .offset(offset),

            // B. Total Count
            db.select({ count: count() })
              .from(AdsTable)
              .leftJoin(UserTable, eq(AdsTable.user_id, UserTable.user_id))
              .where(allFilters),

            // C. Count Categories (🔴 CHANGED to Sub-Category)
            db.select({ label: AdsTable.sub_category, slug: AdsTable.sub_slug, count: count() })
              .from(AdsTable)
              .leftJoin(UserTable, eq(AdsTable.user_id, UserTable.user_id))
              .where(categoryFilters)
              .groupBy(AdsTable.sub_category, AdsTable.sub_slug), // Group by sub

            // D. Count Regions
            db.select({ label: AdsTable.region, count: count() })
              .from(AdsTable)
              .leftJoin(UserTable, eq(AdsTable.user_id, UserTable.user_id))
              .where(regionFilters)
              .groupBy(AdsTable.region),

            // E. Count Towns
            db.select({ label: AdsTable.town, count: count() })
              .from(AdsTable)
              .leftJoin(UserTable, eq(AdsTable.user_id, UserTable.user_id))
              .where(townFilters)
              .groupBy(AdsTable.town),

            // F. Count Condition
            db.select({ label: sql<string>`${AdsTable.metadata}->>'condition'`, count: count() })
              .from(AdsTable)
              .leftJoin(UserTable, eq(AdsTable.user_id, UserTable.user_id))
              .where(conditionFilters)
              .groupBy(sql`${AdsTable.metadata}->>'condition'`),

            // G. Count Negotiable
            db.select({ label: sql<string>`${AdsTable.metadata}->>'negotiable'`, count: count() })
              .from(AdsTable)
              .leftJoin(UserTable, eq(AdsTable.user_id, UserTable.user_id))
              .where(negotiableFilters)
              .groupBy(sql`${AdsTable.metadata}->>'negotiable'`),

             // H. Count Verified
             db.select({ label: sql<string>`${UserTable.id_verified}::text`, count: count() })
             .from(AdsTable)
             .leftJoin(UserTable, eq(AdsTable.user_id, UserTable.user_id))
             .where(verifiedSellerFilters)
             .groupBy(UserTable.id_verified),
        ]);

        const total = totalCount[0].count;

        return c.json({
            items,
            countAds: {
                category: countCategory.map(c => ({ label: c.label, count: c.count, value: c.slug })),
                region: countRegion,
                town: countTown,
                condition: countCondition,
                negotiable: countNegotiable,
                verifiedSellers: countVerifiedSellers
            },
            total,
            hasMore: offset + items.length < total,
            page: page
        }, 200);

    } catch (error) {
        console.error("Search Error:", error);
        return c.json({ items: [], total: 0, hasMore: false }, 200);
    }
});

export default globalSearchCatalog;