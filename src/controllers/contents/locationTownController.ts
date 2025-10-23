import { Request, Response } from "express";
import db from "../../config/db/connection/dbConnection";
import {locationTable, townTable } from "../../config/db/schema/contents/location.town";
import { eq, sql } from "drizzle-orm";
import { mainCategoryTable, subCategoryTable } from "../../config/db/schema/contents/categories";



export const getLocationAndTown = async(_req: Request, res: Response)=> {
       try {

          const result = await db
              .select({
                  region: locationTable.region,
                  town: sql<string[]>`array_agg(${townTable.name})`,
              })
              .from(locationTable)
              .innerJoin(townTable, eq(townTable.location_id, locationTable.location_id))
              .groupBy(locationTable.region);

            
        res.status(200).json(result)
        
       } catch (error) {
          if(error instanceof Error){
            console.error(error.message);
            res.status(400).json([])
          }
       }

    
}

export const getCategories = async(_req: Request, res: Response)=> {
       try {

          const result = await db
              .select({
                  mainName: mainCategoryTable.main_name,
                  subCategories: sql`json_agg(${subCategoryTable.sub_name})`,
              })
              .from(mainCategoryTable)
              .innerJoin(subCategoryTable, eq(subCategoryTable.main_category_id, mainCategoryTable.main_category_id))
              .groupBy(mainCategoryTable.main_name);
             
        res.status(200).json(result)
        
       } catch (error) {
          if(error instanceof Error){
            console.error(error.message);
            res.status(400).json([])
          }
       }

    
}