import sql from "../../../../config/dbConn.js";

export const publishedAdsQuery = async (userID, main_category, sub_category) =>{
    const data = await sql`
            SELECT
            ads_id,
            images,
            (metadata->>'price') price,
            description,
            title,
            region,
            town,
            deactivated,
            main_category,
            sub_category,
            created_at,
            (metadata->>'condition') condition
            FROM ads
            WHERE user_id = ${userID}
            ${main_category ? sql`AND main_category = ${main_category}` : sql``}
            ${sub_category ? sql`AND sub_category = ${sub_category}` : sql``}
          `;
       return data;   
}


export const mainCategoryCountQuery = async(userID, main_category, sub_category)=>{
     const data = await sql`
          SELECT 
          main_category,
          count(*) as total 
          FROM ads 
          WHERE user_id = ${userID}
          ${main_category ? sql`AND main_category = ${main_category}` : sql``}
          ${sub_category ? sql`AND sub_category = ${sub_category}` : sql``} 
          GROUP BY main_category
       `
       return data;
}


export const subCategoryCountQuery = async(userID, main_category, sub_category)=>{
     const data = await sql`
          SELECT 
          sub_category,
          count(*) as total 
          FROM ads 
          WHERE user_id = ${userID}
          ${main_category ? sql`AND main_category = ${main_category}` : sql``}
          ${sub_category ? sql`AND sub_category = ${sub_category}` : sql``} 
          GROUP BY sub_category
        `
        return data;
}