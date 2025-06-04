import pg from "pg";
const { Pool } = pg;

const connectionString=`postgresql://postgres.giukqbonzinrabejotuk:S&BVZqwghv(S.b9@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`

const pool = new Pool({ connectionString })

export default pool;
