import sql from '../config/dbConn.js'

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const countElectronics = async(req, res)=>{

    try {

        const mobilePhones = await sql`
           SELECT COUNT(*)
           FROM mobilephones
        `
       res.status(200).json([{
         mobilephones: mobilePhones[0].count,
         tablets: 23,
         laptops: 21,
         monitors: 13,
         headphones: 2,
         desktopcomputer: 5,
         console: 31,
         camera: 26,
         phoneaccessories: 24,
         computeraccessories: 3
       }]) 
    } catch (error) {
        
    }
    

}