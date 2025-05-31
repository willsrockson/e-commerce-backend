import sql from "../../../../config/dbConn";


export const getMobilePhones = async()=>{
    const data = await sql`
      SELECT
      ads.ads_id,
      ads.region,
      ads.town,
      ads.title,
      ads.images,
      ads.created_at,
      users.isverifiedstore,
      (metadata->>'price') price,
      (metadata->>'condition') condition
      FROM ads
      JOIN users on users.user_id = ads.user_id
      WHERE ads.deactivated != true AND ads.main_category = ${main_category} AND ads.sub_category = ${sub_category}
      ${region ? sql`AND ads.region = ${region}` : sql``}
      ${town ? sql`AND ads.town = ${town}` : sql``}
      ${brand ? sql`AND metadata->>'brand' = ${brand}` : sql``}
      ${model ? sql`AND metadata->>'model' = ${model}` : sql``}
      ${condition ? sql`AND metadata->>'condition' = ${condition}` : sql``}
      ${min_price ? sql`AND (metadata->>'price')::int >= ${min_price}` : sql``}
      ${max_price ? sql`AND (metadata->>'price')::int <= ${max_price}` : sql``}
      ${disk_space ? sql`AND metadata->>'disk_space' = ${disk_space}` : sql``}
      ${color ? sql`AND metadata->>'color' = ${color}` : sql``}
      ${isverifiedseller === "True" ? sql`AND users.isverifiedstore = ${true}` : sql``}
      ${isverifiedseller === "False" ? sql`AND users.isverifiedstore = ${false}` : sql``}
      ORDER BY created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `
    return data;
}