import postgres from "postgres"
import "dotenv/config"

const connectionString = process.env.DATABASE_URL;
const sql = postgres(connectionString,{
    max: 5,
    idle_timeout: 10,
    connect_timeout: 30_000,
    onnotice: (notice) => console.warn("DB Notice:", notice),
    onclose: () => console.warn("Database connection closed"),
});
export default sql;