import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
//import { ENVIRONMENT } from './src/config/constants.js';

//console.log(ENVIRONMENT);

export default defineConfig({
  out: './drizzle',
  schema: './src/database/schema/**/*.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.LOCAL_DATABASE_URL!,
  },
});
