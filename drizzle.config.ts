import { DevelopmentMode } from './src/types/enums';
import "dotenv/config"
import { defineConfig } from "drizzle-kit"

export default defineConfig({
    dialect: "postgresql",
    schema: "./src/config/db/schema/**/*.ts",
    out: "./drizzle",
    dbCredentials: {
        url: process.env.NODE_ENV === DevelopmentMode.Development
            ? process.env.LOCAL_DATABASE_URL as string
            : process.env.DATABASE_URL as string,
    },
    strict: true,
    verbose: true,
})