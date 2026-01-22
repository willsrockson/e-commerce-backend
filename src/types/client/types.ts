export type GoogleOauthUserData = {
  sub: string;
  email: string;
  given_name: string;
  family_name: string;
  email_verified: boolean;
}


export type Payload = {
  userId: string,
  tokenVersion: number;
  role: string,
  exp: Date
}
export type JwtSign = {
  userId: string;
  role: string;
  tokenVersion: number;
}

export type JwtEmailSign = Omit<JwtSign, 'tokenVersion'>;

export type UpdateAccountSettings = { 
  store_name?: string; 
  full_name?: string; 
  phone_primary?: string;
  phone_secondary?: string; 
  store_address?: string; 
  store_name_slug?: string;
  store_description?: string;
  open_hours?: string;
}

export type EmailVCache = {
   to: string[];
   subject: string;
   html: string;
   wantCache: boolean;
   userId?: string;
   cacheValue: Object;
   ttl: string | number;
}

export type CodeEmailParams = {
  appName: string;
  userName?: string;
  purposeText: string;
  code: string;
  expiresInMinutes: number;
};

export type AccountCacheValues = {
   code?: string;
   phoneNumber?: string;
   email?: string;
   role?: "user" | "moderator" | "superuser";
};

export type CloudinaryUploader = {
  secure_url: string;
  public_id: string;
  version: string;
}


export interface MyAds{
  main_category?: string;
  sub_category?: string;
}


