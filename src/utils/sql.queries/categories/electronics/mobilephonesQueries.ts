import { adsTable } from './../../../../config/db/schema/ads/ads.schema';
import { and, count, desc, eq, SQL, sql} from "drizzle-orm";
import db from "../../../../config/db/connection/dbConnection";
import { UserTable } from "../../../../config/db/schema/user.schema";
import { locationTable, townTable } from '../../../../config/db/schema/contents/location.town';
import { mobilePhoneGeneral, mobilePhoneTable } from '../../../../config/db/schema/contents/electronics/mobilephones';


interface IFilterType{
      filters: SQL<unknown> | undefined;
      limit?: number;
      offset?: number;
      region?: any;
      brand?: any;
      model?: any;
}


export const defaultWhere = and(eq(adsTable.sub_category, "Mobile Phones"), eq(adsTable.deactivated, false));

export const mobilePhonesQuery = async({filters, limit, offset}:IFilterType)=>{
      
      const phoneResult = await db
         .select({
            ads_id: adsTable.ads_id,
            region: adsTable.region,
            town: adsTable.town,
            firstImage: sql<string>`${adsTable.images}[1]`.as("first_image"),
            title: adsTable.title,
            userIdVerificationStatus: UserTable.id_verification_status, 
            description: adsTable.description,
            createdAt: adsTable.created_at,
            price: sql<number>`metadata->>'price'`,
            condition: sql<string>`metadata->>'condition'`
         })
         .from(adsTable)
         .innerJoin(UserTable, eq(UserTable.user_id, adsTable.user_id))
         .where(and( defaultWhere , filters ?? sql`TRUE`))
         .orderBy(desc(adsTable.updated_at))
         .offset(offset ?? 0)
         .limit(limit ?? 0);

      return phoneResult;  
};

export const countMobilePhoneQuery = async ({ filters }: IFilterType) => {
    const countMobile = await db
        .select({
            mobile_count: count(adsTable.ads_id).as("mobile_count"),
        })
        .from(adsTable)
        .innerJoin(UserTable, eq(UserTable.user_id, adsTable.user_id))
        .where(and(defaultWhere, filters ?? sql`TRUE`));
    return countMobile;
};


export const regionQuery = async({filters}: IFilterType)=>{
    
    const sub = db
        .select({
            region: adsTable.region,
            count: count(adsTable.ads_id).as("count")
        })
        .from(adsTable)
        .innerJoin(UserTable, eq(UserTable.user_id, adsTable.user_id))
        .where(and( defaultWhere , filters ?? sql`TRUE`))
        .groupBy(adsTable.region)
        .as('sub');

     const region = await db
         .select({
             label: locationTable.region,
             count: sql<number>`COALESCE(${sub.count}, 0)`,
         })
         .from(locationTable)
         .leftJoin(sub, eq(locationTable.region, sub.region));
 
    return region;
}


export const townQuery = async({region,filters }:IFilterType)=>{

    if(!region) return []
    console.log('Inside town query', region);
    
    //This query get's the location of the location selected by the user
    const location = db
         .select({
            location_id: locationTable.location_id
         })
         .from(locationTable)
         .where(eq(locationTable.region, region));
    
    const sub = db
        .select({
            town: adsTable.town,
            count: count(adsTable.ads_id).as("count")
        })
        .from(adsTable)
        .innerJoin(UserTable, eq(UserTable.user_id, adsTable.user_id))
        .where(and( defaultWhere , filters ?? sql`TRUE`))
        .groupBy(adsTable.town)
        .as('sub');

    const towns = await db
         .select({
             label: townTable.name,
             count: sql<number>`COALESCE(${sub.count}, 0)`,
         })      
         .from(townTable)
         .leftJoin(sub, eq(townTable.name, sub.town))
         .where(eq(townTable.location_id, location))
         .orderBy(sql`(${sub.count} = 0)`, desc(sub.count));
    
    return towns;
}



export const brandQuery = async({ filters }: IFilterType)=>{

      const brand_sub = db
          .select({
             brand_sub: sql<string>`${adsTable.metadata}->>'brand'`.as('brand_sub'),
             count: count(adsTable.ads_id).as('count')
          })
          .from(adsTable)
          .innerJoin(UserTable, eq(UserTable.user_id, adsTable.user_id))
          .where(and(defaultWhere, filters ?? sql`TRUE`))
          .groupBy(sql`${adsTable.metadata}->>'brand'`)
          .as('brand_sub');

      const brands = await db
          .selectDistinct({
              label: mobilePhoneTable.brand,
              count: sql<number>`COALESCE(${brand_sub.count}, 0)`,
          })
          .from(mobilePhoneTable)
          .leftJoin(brand_sub,eq(brand_sub.brand_sub, mobilePhoneTable.brand));

      return brands;
}


export const modelQuery = async({ filters, brand }: IFilterType) => {
    if (!brand) return [];
    const model_sub = db
          .select({
             ads_model: sql<string>`${adsTable.metadata}->>'model'`.as('ads_model'),
             count: count(adsTable.ads_id).as('count')
          })
          .from(adsTable)
          .innerJoin(UserTable, eq(UserTable.user_id, adsTable.user_id)) 
          .where(and(defaultWhere, filters ?? sql`TRUE`))
          .groupBy(sql`${adsTable.metadata}->>'model'`)
          .as('model_sub');

    const modelResult = await db
         .select({
            label: mobilePhoneTable.model,
            count: sql<number>`COALESCE(${model_sub.count}, 0)`, //model_sub.count
         })
         .from(mobilePhoneTable)
         .leftJoin(model_sub, eq( model_sub.ads_model, mobilePhoneTable.model))
         .where(eq(mobilePhoneTable.brand, brand))
         .orderBy(sql`(${model_sub.count} = 0)`, desc(model_sub.count));


    return modelResult;    
};


export const conditionQuery = async({filters}: IFilterType)=>{

    const sub = db
        .select({
            sub_condition: sql<string>`DISTINCT unnest(${mobilePhoneGeneral.conditions})`.as('sub_condition'),
        })
        .from(mobilePhoneGeneral)
        .as("sub");
    
    const ads_sub = db
        .select({
            ads_condition: sql`${adsTable.metadata}->>'condition'`.as('ads_condition'),
            count: count(adsTable.ads_id).as('count')
        }) 
        .from(adsTable)
        .innerJoin(UserTable, eq(UserTable.user_id, adsTable.user_id))
        .where(and(defaultWhere, filters ?? sql`TRUE`))
        .groupBy(sql`${adsTable.metadata}->>'condition'`)
        .as('ads_sub')   
    
    const conditionResult = await db
      .select({
          label: sub.sub_condition,
          count: sql<number>`COALESCE(${ads_sub.count}, 0)`.as('count')
      })
      .from(sub)
      .leftJoin(ads_sub, eq(ads_sub.ads_condition, sub.sub_condition))
      .orderBy(desc(sql`count`));  
     
   return conditionResult;        
}


export const ramQuery = async({filters}: IFilterType)=>{
      const sub = db
        .select({
            sub_ram: sql<string>`DISTINCT unnest(${mobilePhoneTable.ram})`.as('sub_ram'),
        })
        .from(mobilePhoneTable)
        .as("sub");
    
    const ads_sub = db
         .select({
             ads_ram: sql`${adsTable.metadata}->>'ram'`.as('ads_ram'),
             count: count(adsTable.ads_id).as('count')
         })
         .from(adsTable)
         .innerJoin(UserTable, eq(UserTable.user_id, adsTable.user_id)) 
         .where(and(defaultWhere, filters ?? sql`TRUE`))
         .groupBy(sql`${adsTable.metadata}->>'ram'`)
         .as('ads_sub');
    
    const ramResults = await db
        .select({
           label: sub.sub_ram,
           count: sql<number>`COALESCE(${ads_sub.count}, 0)`.as('count')
        })
        .from(sub)
        .leftJoin(ads_sub, eq(ads_sub.ads_ram, sub.sub_ram))
        .orderBy(desc(sql`count`));
    
    return ramResults;    
}



export const storageQuery = async({filters}: IFilterType)=>{
      const sub = db
        .select({
            sub_storage: sql<string>`DISTINCT unnest(${mobilePhoneTable.storage})`.as('sub_storage'),
        })
        .from(mobilePhoneTable)
        .as("sub");
    
    const ads_sub = db
         .select({
             ads_storage: sql`${adsTable.metadata}->>'storage'`.as('ads_storage'),
             count: count(adsTable.ads_id).as('count')
         })
         .from(adsTable)
         .innerJoin(UserTable, eq(UserTable.user_id, adsTable.user_id)) 
         .where(and(defaultWhere, filters ?? sql`TRUE`))
         .groupBy(sql`${adsTable.metadata}->>'storage'`)
         .as('ads_sub');
    
    const storageResults = await db
        .select({
           label: sub.sub_storage,
           count: sql<number>`COALESCE(${ads_sub.count}, 0)`.as('count')
        })
        .from(sub)
        .leftJoin(ads_sub, eq(ads_sub.ads_storage, sub.sub_storage))
        .orderBy(desc(sql`count`));
    
    return storageResults;    
}

export const colorQuery = async({filters, model}: IFilterType) =>{
    if(!model) return []
    const sub = db
        .select({
            sub_color: sql<string>`DISTINCT unnest(${mobilePhoneTable.colors})`.as('sub_color'),
        })
        .from(mobilePhoneTable)
        .where(eq(mobilePhoneTable.model, model))
        .as("sub");
    
    const ads_sub = db
         .select({
             ads_color: sql`${adsTable.metadata}->>'color'`.as('ads_color'),
             count: count(adsTable.ads_id).as('count')
         })
         .from(adsTable)
         .innerJoin(UserTable, eq(UserTable.user_id, adsTable.user_id)) 
         .where(and(defaultWhere, filters ?? sql`TRUE`))
         .groupBy(sql`${adsTable.metadata}->>'color'`)
         .as('ads_sub');  
    
   const colorResults = await db
        .select({
           label: sub.sub_color,
           count: sql<number>`COALESCE(${ads_sub.count}, 0)`.as('count')
        })
        .from(sub)
        .leftJoin(ads_sub, eq(ads_sub.ads_color, sub.sub_color))
        .orderBy(desc(sql`count`));
    
    return colorResults;        

}


export const screenSizeQuery = async({filters}: IFilterType) =>{
    
    const sub = db
        .select({
            ads_screen_size: sql`${adsTable.metadata}->>'screen_size'`.as("ads_screen_size"),
            total: count(adsTable.ads_id).as("total")
        })
        .from(adsTable)
        .innerJoin(UserTable, eq(UserTable.user_id, adsTable.user_id))
        .where(and(defaultWhere, filters ?? sql`TRUE`))
        .groupBy(sql`${adsTable.metadata}->>'screen_size'`)
        .as("sub");

    const screenSizeResults = await db
        .selectDistinct({
            label: mobilePhoneTable.screen_size,
            count: sql<number>`COALESCE(${sub.total}, 0)`.as('count')
        })
        .from(mobilePhoneTable)
        .leftJoin(sub, eq(sub.ads_screen_size, mobilePhoneTable.screen_size))
        .orderBy(desc(sql`count`));

    
    return screenSizeResults;        

}



export const exchangePossibleQuery = async({filters}: IFilterType) =>{

    const sub = db
        .select({
            sub_exchange_possible: sql<string>`DISTINCT unnest(${mobilePhoneGeneral.exchange_possible})`.as('sub_exchange_possible'),
        })
        .from(mobilePhoneGeneral)
        .as("sub");
    
    const ads_sub = db
        .select({
            ads_exchange_possible: sql`${adsTable.metadata}->>'exchange_possible'`.as("ads_exchange_possible"),
            total: count(adsTable.ads_id).as("total")
        })
        .from(adsTable)
        .innerJoin(UserTable, eq(UserTable.user_id, adsTable.user_id))
        .where(and(defaultWhere, filters ?? sql`TRUE`))
        .groupBy(sql`${adsTable.metadata}->>'exchange_possible'`)
        .as("ads_sub");

    const exchangePossibleResults = await db
        .select({
            label: sub.sub_exchange_possible,
            count: sql<number>`COALESCE(${ads_sub.total}, 0)`.as('count')
        })
        .from(sub)
        .leftJoin(ads_sub, eq(ads_sub.ads_exchange_possible, sub.sub_exchange_possible))
        .orderBy(desc(sql`count`));

    
    return exchangePossibleResults;        

}





export const negotiableQuery = async({filters}: IFilterType) =>{

    const sub = db
        .select({
            sub_negotiable: sql<string>`DISTINCT unnest(${mobilePhoneGeneral.negotiable}::text[])`.as('sub_negotiable'),
        })
        .from(mobilePhoneGeneral)
        .as("sub");
    
    const ads_sub = db
        .select({
            ads_negotiable: sql`${adsTable.metadata}->>'negotiable'`.as("ads_negotiable"),
            total: count(adsTable.ads_id).as("total")
        })
        .from(adsTable)
        .innerJoin(UserTable, eq(UserTable.user_id, adsTable.user_id))
        .where(and(defaultWhere, filters ?? sql`TRUE`))
        .groupBy(sql`${adsTable.metadata}->>'negotiable'`)
        .as("ads_sub");

    const exchangePossibleResults = await db
        .select({
            label: sub.sub_negotiable,
            count: sql<number>`COALESCE(${ads_sub.total}, 0)`.as('count')
        })
        .from(sub)
        .leftJoin(ads_sub, eq(ads_sub.ads_negotiable, sub.sub_negotiable))
        .orderBy(desc(sql`count`));

    
    return exchangePossibleResults;        

}


export const veriFiedSellerQuery = async ({ filters }: IFilterType) => {

    const sub = db
        .select({
            sub_v_status: sql<string>`DISTINCT unnest(${mobilePhoneGeneral.verification_status})`.as(
                "sub_v_status"
            ),
        })
        .from(mobilePhoneGeneral)
        .as("sub");

    const ads_sub = db
        .select({
            status: UserTable.id_verification_status,
            total: count(adsTable.ads_id).as("total"),
        })
        .from(adsTable)
        .innerJoin(UserTable, eq(UserTable.user_id, adsTable.user_id))
        .where(and(defaultWhere, filters ?? sql`TRUE`))
        .groupBy(UserTable.id_verification_status)
        .as("ads_sub");

    const verifiedResults = await db
        .select({
            label: sub.sub_v_status,
            count: sql<number>`COALESCE(${ads_sub.total}, 0)`.as("count"),
        })
        .from(sub)
        .leftJoin(
            ads_sub,
            sql`${ads_sub.status}::text = ${sub.sub_v_status}` // cast to the same type
        );
        
    return verifiedResults;
};




/*


export const regionTownQuery = async({filters}: IQueryType)=>{

    // 1) Subquery: one row per (region, town) with its ad count
    const sub = db
        .select({
            region: adsTable.region,
            town: adsTable.town,
            townCount: count(adsTable.ads_id).as("town_count"),
        })
        .from(adsTable)
        .innerJoin(UserTable, eq(UserTable.user_id, adsTable.user_id))
        .where(and( defaultWhere , filters ?? sql`TRUE`))
        .groupBy(adsTable.region, adsTable.town)
        .as("sub");

    // 2) Outer query: aggregate towns per region and sum counts
    const regionTownResult = await db
        .select({
            label: sub.region,
            count: sql<number>`sum(${sub.townCount})::int`,
            towns: sql<any>`
      json_agg(
        json_build_object(
          'label', ${sub.town},
          'count', ${sub.townCount}
        )
        ORDER BY ${sub.town}
      )
    `,
        })
        .from(sub)
        .groupBy(sub.region);

    return regionTownResult;
}


*/