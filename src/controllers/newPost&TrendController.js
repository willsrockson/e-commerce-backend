import sql from "../config/dbConn.js"
//const currentTime = new Date(Date.now()).toISOString();

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const NewPosts = async(req, res)=>{
    
   try {
      const getNewAds = await sql `
         SELECT 
         ads.ads_id, 
         ads.images, 
         (metadata->>'price') price, 
         ads.title, 
         ads.region,
         ads.town,
         ads.sub_category,
         ads.main_category,  
         (metadata->>'condition') condition,
         ads.created_at,
         users.isverifiedstore
         FROM ads
         JOIN users ON users.user_id = ads.user_id
         WHERE ads.deactivated != true 
         ORDER BY ads.created_at DESC
         LIMIT 20
       `
      
       if(!getNewAds || getNewAds.length === 0){
         return res.status(200).json([])
       }

      res.status(200).json(getNewAds)
      
   } catch (error) {
      res.status(401).json([])
   }

}