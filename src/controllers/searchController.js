import sql from "../config/dbConn.js"

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

export const findProduct = async(req, res)=>{
    const searchResultsArray = []

    try {
        const { search } = req.body

        if (!search) return res.status(400).json({ message: 'Search query is missing' });

        const keywords = search.toLowerCase().trim().split(/\s+/).filter(Boolean);

        if (keywords.length === 0) {
             return res.status(200).json([]);
          }

        //For mobile phones 
        let query = sql`
            SELECT category, title, brand
            FROM mobilephones
        `;
         
        if (keywords.length > 0) {
            query = sql`${query} WHERE`;
            keywords.forEach((key, index) => {
              // Add AND between conditions, but not before the first one
              if (index > 0) {
                query = sql`${query} AND`;
              }
              // Add the condition for this keyword
              query = sql`${query} (
               LOWER(mobilephones.brand) LIKE ${'%' + key + '%'} OR
               LOWER(mobilephones.model) LIKE ${'%' + key + '%'} OR
               LOWER(mobilephones.condition) LIKE ${'%' + key + '%'} OR
               LOWER(REPLACE(mobilephones.disk_space, ' ', '')) LIKE ${'%' + key + '%'} OR
               LOWER(mobilephones.disk_space) LIKE ${'%' + key + '%'}
              )`;
            });
            query = sql`${query} LIMIT 1`;
          }
        
          const results = await query;
          
        if(results[0].category) searchResultsArray.push(results[0].category);
        
        res.status(200).json(searchResultsArray)

    } catch (error) {
        return res.status(400).json([])
    }
}