import sql from '../config/dbConn.js'



// Get phones + Query
/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const fetchMobilePhones = async(req, res) =>{
    
      
    try {

        const { region, town, brand, model, condition, min_price, max_price , disk_space, color } = req.query;
        
        const finalData = await sql`
            SELECT mobilephones.mobile_id, mobilephones.images, mobilephones.price, mobilephones.description, mobilephones.title, mobilephones.region, mobilephones.condition, users.isverifiedstore
            FROM mobilephones
            JOIN users on users.user_id = mobilephones.user_id
            WHERE mobilephones.deactivated != true
            ${region ? sql`AND region = ${region}`: sql``}
            ${town ? sql`AND town = ${town}`: sql``}
            ${brand ? sql`AND brand = ${brand}`: sql``}
            ${model ? sql`AND model = ${model}`: sql``}
            ${condition ? sql`AND condition = ${condition}`: sql``}
            ${min_price ? sql`AND price >= ${min_price}` : sql``}
            ${max_price ? sql`AND price <= ${max_price}`: sql``}
            ${disk_space ? sql`AND disk_space = ${disk_space}`: sql``}
            ${color ? sql`AND color = ${color}`: sql`` }
            
         `;
        
        res.status(200).json(finalData)
        
    } catch (error) {
        res.json([])
    }       

       
             
}



// Function below gets each phones clicked on the site

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const getEachPhoneById = async(req, res)=>{
     const { id } = req.params

     try {
         const getPhone = await sql`
            SELECT m.mobile_id, m.brand, m.model, m.region, m.town, m.color, m.disk_space, m.ram_size, m.exchange_possible,
            m.price, m.description, m.title, m.images, m.negotiation, m.condition, m.created_at, avatars.imageurl,
            users.firstname, users.lastname, users.phone, users.phone2, users.isverifiedstore, users.created_at As user_created_at
            FROM mobilephones AS m
            FULL JOIN avatars on avatars.user_id = m.user_id
            FULL JOIN users on users.user_id = avatars.user_id
            WHERE m.mobile_id = ${id};
         `
         if(!getPhone){
            throw new Error("Phone not found")
         }

         //console.log(getPhone);
         

         res.status(200).json(getPhone);
        
     } catch (error) {
        console.log(error.message);
        return res.status(401).json([])
     }
          
}