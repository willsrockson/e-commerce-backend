import 'dotenv/config'
import { Google } from "arctic";

const clientId = process.env.GOOGLE_CLIENT_ID!;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
const redirectURI = "http://localhost:5001/api/user/google/callback";

// Initialize the helper
export const google = new Google(clientId, clientSecret, redirectURI);