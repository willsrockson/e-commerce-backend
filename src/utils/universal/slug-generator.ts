import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "../../database/connection.js";
import { UserTable } from "../../database/schema/client/user-schema.js";
import { HTTPException } from "hono/http-exception";
import { CODES } from "../../config/constants.js";


export function generateSlug(title: string): string {
  const cleanTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  // Generate a random 6-char string to ensure uniqueness
  const uniqueSuffix = Math.random().toString(36).substring(2, 8); 

  return `${cleanTitle}-${uniqueSuffix}`;
}


export async function createAutoStoreNameSlug(name: string): Promise<string> {
  if(!name.trim()){
     throw new HTTPException(CODES.HTTP.BAD_REQUEST, {message: 'Store name is invalid'})
  }
  let baseSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!baseSlug.trim()){
     throw new HTTPException(CODES.HTTP.BAD_REQUEST, {message: 'Please enter a valid store name'})
  }

  const check1 = await db
     .select({ storeNameSlug: UserTable.store_name_slug })
     .from(UserTable)
     .where(eq(UserTable.store_name_slug, baseSlug));

  if (check1.length === 0) return baseSlug;

  const ghSlug = `${baseSlug}-gh`;
  const check2 = await db.select({ storeNameSlug: UserTable.store_name_slug }).from(UserTable).where(eq(UserTable.store_name_slug, ghSlug));

  if (check2.length === 0) return ghSlug;

  return `${baseSlug}-${nanoid(4)}`;
}