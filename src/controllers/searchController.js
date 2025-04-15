import sql from "../config/dbConn.js"

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const findProduct = async(req, res)=>{
    try {
        const { search } = req.query
        
        if (!search) return res.status(400).json({ message: 'Search query is missing' });

        const searchTerm = `%${search.toLowerCase()}%`;

        const results = await sql`
            SELECT mobile_id AS ad_id, category, title, region, town, condition, price, images 
            FROM mobilephones
            WHERE 
                LOWER(model) LIKE ${searchTerm} OR 
                LOWER(brand) LIKE ${searchTerm} OR 
                LOWER(title) LIKE ${searchTerm} OR
                LOWER(description) LIKE ${searchTerm}
            ORDER BY created_at DESC
            LIMIT 50;
        `;

        res.status(200).json(results)

    } catch (error) {
        return res.status(400).json([])
    }
}