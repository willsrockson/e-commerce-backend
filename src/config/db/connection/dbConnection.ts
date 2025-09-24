import "dotenv/config"
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.LOCAL_DATABASE_URL,
});
const db = drizzle({ client: pool, logger: false });
export default db;
 
