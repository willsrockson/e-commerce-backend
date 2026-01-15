import { and, count, desc, eq, SQL, sql} from "drizzle-orm";
import { db } from '../../../../connection.js';
import { RegionTable, TownTable } from '../../../../schema/client/contents/region-town-schema.js';
import { UserTable } from '../../../../schema/client/user-schema.js';
import { MobilePhoneGeneral, MobilePhoneTable } from '../../../../schema/client/contents/electronics/mobile-phones-schema.js';
import { AdsTable } from "../../../../schema/client/contents/ads-schema.js";

interface IFilterType{
      filters: SQL<unknown> | undefined;
      limit?: number;
      offset?: number;
      region?: any;
      brand?: any;
      model?: any;
}


export const defaultWhere = and(eq(AdsTable.sub_category, "Mobile Phones"), eq(AdsTable.deactivated, false));

export const mobilePhonesQuery = async({filters, limit, offset}:IFilterType)=>{
      
      const phoneResult = await db
         .select({
            adsId: AdsTable.ads_id,
            region: AdsTable.region,
            town: AdsTable.town,
            slug: AdsTable.slug,
            mainSlug: AdsTable.main_slug,
            subSlug: AdsTable.sub_slug,
            firstImage: sql<string>`${AdsTable.images}[1]`.as("first_image"),
            title: AdsTable.title,
            idVerified: UserTable.id_verified, 
            description: AdsTable.description,
            createdAt: AdsTable.created_at,
            price: sql<number>`metadata->>'price'`,
            condition: sql<string>`metadata->>'condition'`
         })
         .from(AdsTable)
         .innerJoin(UserTable, eq(UserTable.user_id, AdsTable.user_id))
         .where(and( defaultWhere , filters ?? sql`TRUE`))
         .orderBy(desc(AdsTable.updated_at))
         .offset(offset ?? 0)
         .limit(limit ?? 0);
       
      return phoneResult;  
};

export const countMobilePhoneQuery = async ({ filters }: IFilterType) => {
    const countMobile = await db
        .select({
            mobile_count: count(AdsTable.ads_id).as("mobile_count"),
        })
        .from(AdsTable)
        .innerJoin(UserTable, eq(UserTable.user_id, AdsTable.user_id))
        .where(and(defaultWhere, filters ?? sql`TRUE`));
        
    return countMobile;
};


export const regionQuery = async({filters}: IFilterType)=>{
    
    const sub = db
        .select({
            region: AdsTable.region,
            count: count(AdsTable.ads_id).as("count")
        })
        .from(AdsTable)
        .innerJoin(UserTable, eq(UserTable.user_id, AdsTable.user_id))
        .where(and( defaultWhere , filters ?? sql`TRUE`))
        .groupBy(AdsTable.region)
        .as('sub');

     const region = await db
         .select({
             label: RegionTable.name,
             count: sql<number>`COALESCE(${sub.count}, 0)`,
         })
         .from(RegionTable)
         .leftJoin(sub, eq(RegionTable.name, sub.region));
 
    return region;
}


export const townQuery = async({region,filters }:IFilterType)=>{

    if(!region) return []
    console.log('Inside town query', region);
    
    //This query get's the location of the location selected by the user
    const location = db
         .select({
            location_id: RegionTable.region_id
         })
         .from(RegionTable)
         .where(eq(RegionTable.name, region));
    
    const sub = db
        .select({
            town: AdsTable.town,
            count: count(AdsTable.ads_id).as("count")
        })
        .from(AdsTable)
        .innerJoin(UserTable, eq(UserTable.user_id, AdsTable.user_id))
        .where(and( defaultWhere , filters ?? sql`TRUE`))
        .groupBy(AdsTable.town)
        .as('sub');

    const towns = await db
         .select({
             label: TownTable.name,
             count: sql<number>`COALESCE(${sub.count}, 0)`,
         })      
         .from(TownTable)
         .leftJoin(sub, eq(TownTable.name, sub.town))
         .where(eq(TownTable.region_id, location))
         .orderBy(sql`(${sub.count} = 0)`, desc(sub.count));
    
    return towns;
}



export const brandQuery = async({ filters }: IFilterType)=>{

      const brand_sub = db
          .select({
             brand_sub: sql<string>`${AdsTable.metadata}->>'brand'`.as('brand_sub'),
             count: count(AdsTable.ads_id).as('count')
          })
          .from(AdsTable)
          .innerJoin(UserTable, eq(UserTable.user_id, AdsTable.user_id))
          .where(and(defaultWhere, filters ?? sql`TRUE`))
          .groupBy(sql`${AdsTable.metadata}->>'brand'`)
          .as('brand_sub');

      const brands = await db
          .selectDistinct({
              label: MobilePhoneTable.brand,
              count: sql<number>`COALESCE(${brand_sub.count}, 0)`,
          })
          .from(MobilePhoneTable)
          .leftJoin(brand_sub,eq(brand_sub.brand_sub, MobilePhoneTable.brand));

      return brands;
}


export const modelQuery = async({ filters, brand }: IFilterType) => {
    if (!brand) return [];
    const model_sub = db
          .select({
             ads_model: sql<string>`${AdsTable.metadata}->>'model'`.as('ads_model'),
             count: count(AdsTable.ads_id).as('count')
          })
          .from(AdsTable)
          .innerJoin(UserTable, eq(UserTable.user_id, AdsTable.user_id)) 
          .where(and(defaultWhere, filters ?? sql`TRUE`))
          .groupBy(sql`${AdsTable.metadata}->>'model'`)
          .as('model_sub');

    const modelResult = await db
         .select({
            label: MobilePhoneTable.model,
            count: sql<number>`COALESCE(${model_sub.count}, 0)`, //model_sub.count
         })
         .from(MobilePhoneTable)
         .leftJoin(model_sub, eq( model_sub.ads_model, MobilePhoneTable.model))
         .where(eq(MobilePhoneTable.brand, brand))
         .orderBy(sql`(${model_sub.count} = 0)`, desc(model_sub.count));


    return modelResult;    
};


export const conditionQuery = async({filters}: IFilterType)=>{

    const sub = db
        .select({
            sub_condition: sql<string>`DISTINCT unnest(${MobilePhoneGeneral.conditions})`.as('sub_condition'),
        })
        .from(MobilePhoneGeneral)
        .as("sub");
    
    const ads_sub = db
        .select({
            ads_condition: sql`${AdsTable.metadata}->>'condition'`.as('ads_condition'),
            count: count(AdsTable.ads_id).as('count')
        }) 
        .from(AdsTable)
        .innerJoin(UserTable, eq(UserTable.user_id, AdsTable.user_id))
        .where(and(defaultWhere, filters ?? sql`TRUE`))
        .groupBy(sql`${AdsTable.metadata}->>'condition'`)
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
            sub_ram: sql<string>`DISTINCT unnest(${MobilePhoneTable.ram})`.as('sub_ram'),
        })
        .from(MobilePhoneTable)
        .as("sub");
    
    const ads_sub = db
         .select({
             ads_ram: sql`${AdsTable.metadata}->>'ram'`.as('ads_ram'),
             count: count(AdsTable.ads_id).as('count')
         })
         .from(AdsTable)
         .innerJoin(UserTable, eq(UserTable.user_id, AdsTable.user_id)) 
         .where(and(defaultWhere, filters ?? sql`TRUE`))
         .groupBy(sql`${AdsTable.metadata}->>'ram'`)
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
            sub_storage: sql<string>`DISTINCT unnest(${MobilePhoneTable.storage})`.as('sub_storage'),
        })
        .from(MobilePhoneTable)
        .as("sub");
    
    const ads_sub = db
         .select({
             ads_storage: sql`${AdsTable.metadata}->>'storage'`.as('ads_storage'),
             count: count(AdsTable.ads_id).as('count')
         })
         .from(AdsTable)
         .innerJoin(UserTable, eq(UserTable.user_id, AdsTable.user_id)) 
         .where(and(defaultWhere, filters ?? sql`TRUE`))
         .groupBy(sql`${AdsTable.metadata}->>'storage'`)
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
            sub_color: sql<string>`DISTINCT unnest(${MobilePhoneTable.colors})`.as('sub_color'),
        })
        .from(MobilePhoneTable)
        .where(eq(MobilePhoneTable.model, model))
        .as("sub");
    
    const ads_sub = db
         .select({
             ads_color: sql`${AdsTable.metadata}->>'color'`.as('ads_color'),
             count: count(AdsTable.ads_id).as('count')
         })
         .from(AdsTable)
         .innerJoin(UserTable, eq(UserTable.user_id, AdsTable.user_id)) 
         .where(and(defaultWhere, filters ?? sql`TRUE`))
         .groupBy(sql`${AdsTable.metadata}->>'color'`)
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


// export const screenSizeQuery = async({filters}: IFilterType) =>{
    
//     const sub = db
//         .select({
//             ads_screen_size: sql`${AdsTable.metadata}->>'screen_size'`.as("ads_screen_size"),
//             total: count(AdsTable.ads_id).as("total")
//         })
//         .from(AdsTable)
//         .innerJoin(UserTable, eq(UserTable.user_id, AdsTable.user_id))
//         .where(and(defaultWhere, filters ?? sql`TRUE`))
//         .groupBy(sql`${AdsTable.metadata}->>'screen_size'`)
//         .as("sub");

//     const screenSizeResults = await db
//         .selectDistinct({
//             label: MobilePhoneTable.screen_size,
//             count: sql<number>`COALESCE(${sub.total}, 0)`.as('count')
//         })
//         .from(MobilePhoneTable)
//         .leftJoin(sub, eq(sub.ads_screen_size, MobilePhoneTable.screen_size))
//         .orderBy(desc(sql`count`));
          
//     return screenSizeResults;        

// }

export const screenSizeQuery = async ({ filters }: IFilterType) => {
   const distinctScreens = db
      .selectDistinct({
         label: sql<string>`unnest(${MobilePhoneTable.screen_size})`.as("label"),
      })
      .from(MobilePhoneTable)
      .as("distinct_screens");

   //Count ads
   const adCounts = db
      .select({
         ads_screen_size: sql<string>`${AdsTable.metadata}->>'screen_size'`.as("ads_screen_size"),
         total: count(AdsTable.ads_id).as("total"),
      })
      .from(AdsTable)
      .innerJoin(UserTable, eq(UserTable.user_id, AdsTable.user_id))
      .where(and(defaultWhere, filters ?? sql`TRUE`))
      .groupBy(sql`${AdsTable.metadata}->>'screen_size'`)
      .as("ad_counts");

   //Join the Flattened List with the Counts
   const screenSizeResults = await db
      .select({
         label: distinctScreens.label,
         count: sql<number>`COALESCE(${adCounts.total}, 0)`.as("count"),
      })
      .from(distinctScreens)
      .leftJoin(adCounts, eq(distinctScreens.label, adCounts.ads_screen_size))
      .orderBy(desc(sql`count`));

   return screenSizeResults;
};


export const exchangePossibleQuery = async({filters}: IFilterType) =>{

    const sub = db
        .select({
            sub_exchange_possible: sql<string>`DISTINCT unnest(${MobilePhoneGeneral.exchange_possible})`.as('sub_exchange_possible'),
        })
        .from(MobilePhoneGeneral)
        .as("sub");
    
    const ads_sub = db
        .select({
            ads_exchange_possible: sql`${AdsTable.metadata}->>'exchange_possible'`.as("ads_exchange_possible"),
            total: count(AdsTable.ads_id).as("total")
        })
        .from(AdsTable)
        .innerJoin(UserTable, eq(UserTable.user_id, AdsTable.user_id))
        .where(and(defaultWhere, filters ?? sql`TRUE`))
        .groupBy(sql`${AdsTable.metadata}->>'exchange_possible'`)
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
            sub_negotiable: sql<string>`DISTINCT unnest(${MobilePhoneGeneral.negotiable}::text[])`.as('sub_negotiable'),
        })
        .from(MobilePhoneGeneral)
        .as("sub");
    
    const ads_sub = db
        .select({
            ads_negotiable: sql`${AdsTable.metadata}->>'negotiable'`.as("ads_negotiable"),
            total: count(AdsTable.ads_id).as("total")
        })
        .from(AdsTable)
        .innerJoin(UserTable, eq(UserTable.user_id, AdsTable.user_id))
        .where(and(defaultWhere, filters ?? sql`TRUE`))
        .groupBy(sql`${AdsTable.metadata}->>'negotiable'`)
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
            sub_v_status: sql<string>`DISTINCT unnest(${MobilePhoneGeneral.verification_status})`.as(
                "sub_v_status"
            ),
        })
        .from(MobilePhoneGeneral)
        .as("sub");

    const ads_sub = db
        .select({
            status: UserTable.id_verified,
            total: count(AdsTable.ads_id).as("total"),
        })
        .from(AdsTable)
        .innerJoin(UserTable, eq(UserTable.user_id, AdsTable.user_id))
        .where(and(defaultWhere, filters ?? sql`TRUE`))
        .groupBy(UserTable.id_verified)
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
