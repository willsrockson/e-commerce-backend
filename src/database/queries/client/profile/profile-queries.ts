// import { sql, type SQL, desc, eq, and } from "drizzle-orm";
// import { db } from "../../../connection.js";
// import { AdsTable } from "../../../schema/client/contents/ads-schema.js";


// interface Filters {
//    filters: SQL<unknown> | undefined;
//    storeNameSlug: string;
//    offset?: number;
//    limit?: number;
//    main_category?: string;
// }

// export const profilePublishedAdsQuery = async ({ storeNameSlug, limit, offset, filters }: Filters) => {
//    const data = await db
//       .select({
//          adsId: AdsTable.ads_id,
//          firstImage: sql<string>`${AdsTable.images}[1]`.as("first_image"),
//          price: sql<number>`metadata->>'price'`,
//          description: AdsTable.description,
//          title: AdsTable.title,
//          region: AdsTable.region,
//          town: AdsTable.town,
//          deactivated: AdsTable.deactivated,
//          mainCategory: AdsTable.main_category,
//          subCategory: AdsTable.sub_category,
//          slug: AdsTable.slug,
//          mainSlug: AdsTable.main_slug,
//          subSlug: AdsTable.sub_slug,
//          createdAt: AdsTable.created_at,
//          condition: sql<string>`metadata->>'condition'`,
//       })
//       .from(AdsTable)
//       .where(and(eq(AdsTable.user_id, storeNameSlug), filters))
//       .orderBy(desc(AdsTable.updated_at))
//       .offset(offset ?? 0)
//       .limit(limit ?? 0);

//    return data;
// };