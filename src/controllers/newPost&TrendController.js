import sql from "../config/dbConn.js"
const currentTime = new Date(Date.now()).toISOString();

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const NewPosts = async(req, res)=>{
    
   try {
      const get4Phones = await sql `
         SELECT 
         mobilephones.mobile_id, 
         mobilephones.images, 
         mobilephones.price, 
         mobilephones.description, 
         mobilephones.title, 
         mobilephones.region, 
         mobilephones.condition,
         users.isverifiedstore
         FROM mobilephones
         JOIN users ON users.user_id = mobilephones.user_id
         ORDER BY mobilephones.created_at DESC 
         LIMIT 8
       `

   res.status(200).json([...get4Phones])
      
   } catch (error) {
      res.status(401).json([])
   }

}