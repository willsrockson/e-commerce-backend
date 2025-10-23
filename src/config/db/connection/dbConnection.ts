import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { Environment } from "../../../types/enums";

const pool = new Pool({
    connectionString:
        process.env.NODE_ENV === Environment.DEVELOPMENT
            ? process.env.LOCAL_DATABASE_URL as string
            : process.env.DATABASE_URL as string,
    ssl:{ rejectUnauthorized: false }        
});
const db = drizzle({ client: pool, logger: false });
export default db;
