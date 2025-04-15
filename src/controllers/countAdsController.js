import sql from '../config/dbConn.js'

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const countAds = async(req, res)=>{

    try {

        const mobilePhones = await sql`
           SELECT COUNT(*)
           FROM mobilephones
        `
       res.status(200).json([{
         mobilephones: mobilePhones[0].count
       }]) 
    } catch (error) {
        
    }
    

}