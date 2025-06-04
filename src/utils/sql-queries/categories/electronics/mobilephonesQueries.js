import pool from "../../../../config/pgPool.js";

const baseWhere = ` JOIN users on users.user_id = ads.user_id  WHERE ads.deactivated != true AND sub_category = 'mobilephones' `;

export const getMobilePhonesQuery = async(builtQuery, param, limit, offset)=>{
    console.log('Limit', limit, 'Offset', offset);
    
      const query = `
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
                ${baseWhere}
                ${builtQuery}
                ORDER BY created_at DESC
                LIMIT $${param?.length + 2}
                OFFSET $${param?.length + 1 }`
       return await pool.query(query, [...param, offset, limit])     
}


export const countMobilePhoneQuery = async(builtQuery, param)=>{
         let query = `SELECT count(*)
                      FROM ads
                      ${baseWhere}
                      ${builtQuery}`
       return await pool.query(query, [...param])  
}


export const brandCountQuery = async(builtQuery, param)=>{ 

     let query = `SELECT (metadata->'brand') brand, count(*) as total 
                  FROM ads 
                  ${baseWhere} ${builtQuery} group by (metadata->'brand')`

     return await pool.query(query, [...param] )

} 

export const modelCountQuery = async(builtQuery, param)=>{
    let query = `SELECT (metadata->'model') model, count(*) as total 
                  FROM ads 
                  ${baseWhere} ${builtQuery} group by (metadata->'model')`
    return await pool.query(query, [...param] ) 
} 

export const regionCountQuery =async(builtQuery, param)=>{

    let query = `SELECT region, count(*) as total 
                  FROM ads 
                  ${baseWhere} ${builtQuery} group by region`
    return await pool.query(query, [...param] ) 
    
}

export const townCountQuery =async(builtQuery, param)=>{
    let query = `SELECT town, count(*) as total 
                 FROM ads 
                 ${baseWhere} ${builtQuery} group by town`
    return await pool.query(query, [...param] ) 
    
}

export const conditionCountQuery =async(builtQuery, param)=>{
    let query = `SELECT (metadata->'condition') condition, count(*) as total 
                 FROM ads 
                 ${baseWhere} ${builtQuery} group by (metadata->'condition')`
    return await pool.query(query, [...param] ) 
    
}

export const storageCountQuery =async(builtQuery, param)=>{

    let query = `SELECT (metadata->'disk_space') disk_space, count(*) as total 
                 FROM ads 
                 ${baseWhere} ${builtQuery} group by (metadata->'disk_space')`
    return await pool.query(query, [...param] ) 
    
}

export const colorCountQuery =async(builtQuery, param)=>{
    let query = `SELECT (metadata->'color') color, count(*) as total 
                 FROM ads 
                 ${baseWhere} ${builtQuery} group by (metadata->'color')`
    return await pool.query(query, [...param] )
    
}

export const sellersCountQuery =async(builtQuery, param)=>{
    let query = `SELECT users.isverifiedstore, count(*) as total 
                 FROM ads
                 ${baseWhere} ${builtQuery} group by users.isverifiedstore`
    return await pool.query(query, [...param] )
} 


