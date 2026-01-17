import 'dotenv/config'
import { Google } from "arctic";
import { ENVIRONMENT } from '../../config/constants.js';

const clientId = process.env.GOOGLE_CLIENT_ID!;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
const redirectURI = process.env.NODE_ENV === ENVIRONMENT.PROD ? process.env.GOOGLE_REDIRECT_URI! : process.env.LOCAL_HOST_REDIRECT_URI!;

// Initialize the helper
export const google = new Google(clientId, clientSecret, redirectURI);