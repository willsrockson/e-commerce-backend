import { Request, Response } from "express";
import db from "../../../config/db/connection/dbConnection";
import { eq, or, sql } from "drizzle-orm";
import { mobilePhoneGeneral, mobilePhoneTable } from "../../../config/db/schema/contents/electronics/mobilephones";

export const getBrand = async(req: Request, res: Response):Promise<void> =>{
    try {
         const result = await db
              .select({
                  brand: mobilePhoneTable.brand,
              })
              .from(mobilePhoneTable)
              .groupBy(mobilePhoneTable.brand);

        if(result.length === 0){
          res.status(200).json([]);  
          return;    
        } 
        
        res.status(200).json(result);      
        
    } catch (error) {
        if(error instanceof Error){
            console.error(error.message);
            res.status(400).json([]);  
            return;
        }
    }
   
}


export const getModel = async(req: Request, res: Response):Promise<void> =>{
    const { brand } = req.params as { brand: string;}
    
    try {

        if(!brand){
            throw new Error("Couldn't find brand.");
        }
        
        const result = await db
            .select({
                brand: mobilePhoneTable.brand,
                models: sql<any>`json_agg( json_build_object(
                     'model', ${mobilePhoneTable.model},
                     'storages', ${mobilePhoneTable.storage},
                     'colors', ${mobilePhoneTable.colors},
                     'screen_size', ${mobilePhoneTable.screen_size},
                     'battery_size', ${mobilePhoneTable.battery_size},
                     'ram', ${mobilePhoneTable.ram}
                     ) ORDER BY ${mobilePhoneTable.model}
                )`,
            })
            .from(mobilePhoneTable)
            .where(eq(mobilePhoneTable.brand, brand))
            .groupBy(mobilePhoneTable.brand);

        if(result.length === 0){
          res.status(200).json([]);   
          return;   
        }    
        
        res.status(200).json(result);      
        
    } catch (error) {
        if(error instanceof Error){
            console.error(error.message);
            res.status(400).json([]);  
            return;
        }
    }
   
}


export const getMobileGeneral = async(req: Request, res: Response): Promise<void> =>{
     try {
          
        const result = await db
              .select({
                  conditions: mobilePhoneGeneral.conditions,
                  negotiable: mobilePhoneGeneral.negotiable,
                  exchange_possible: mobilePhoneGeneral.exchange_possible,
                  accessories: mobilePhoneGeneral.accessories
              })
              .from(mobilePhoneGeneral);

        if(result.length === 0){
          res.status(200).json([]);  
          return;    
        }       

          res.status(200).json(result);      
        
     } catch (error) {
         if(error instanceof Error){
            console.error(error.message);
            res.status(400).json([]);  
            return;
        }
     }
}