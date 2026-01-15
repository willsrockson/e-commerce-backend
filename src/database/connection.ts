import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { ENVIRONMENT } from "../config/constants.js";

const pool = new Pool({
   connectionString:
      process.env.NODE_ENV === ENVIRONMENT.PROD
         ? process.env.DATABASE_URL!
         : process.env.LOCAL_DATABASE_URL!,
});
export const db = drizzle({ client: pool });
