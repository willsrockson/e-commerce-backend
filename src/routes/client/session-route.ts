import { Hono } from "hono";
import type { Payload } from "../../types/client/types.js";
import { CODES, ROLE } from "../../config/constants.js";
import { HTTPException } from "hono/http-exception";
import { db } from "../../database/connection.js";
import { AvatarTable, UserTable } from "../../database/schema/client/user-schema.js";
import { eq, sql } from "drizzle-orm";
import { deleteCookie } from "hono/cookie";

const session = new Hono();

session.get("/recreate", async (c) => {
   const payload: Payload = c.get("jwtPayload");
   
   if (payload?.role !== ROLE.USER || !payload?.userId) {
      throw new HTTPException(CODES.HTTP.UNAUTHORIZED_ACCESS, { message: "Unauthorized access" });
   }

   //Fetch user data
   const getUserData = await db
      .select({
         fullName: UserTable.full_name,
         imageUrl: AvatarTable.image_url,
         tokenVersion: UserTable.token_version
      })
      .from(UserTable)
      .leftJoin(AvatarTable, eq(UserTable.user_id, AvatarTable.user_id))
      .where(eq(UserTable.user_id, payload.userId));

   if (getUserData?.length === 0) {
      throw new HTTPException(CODES.HTTP.NOT_FOUND, { message: "User not found" });
   }
   if(getUserData[0]?.tokenVersion !== payload.tokenVersion){
      deleteCookie(c, 'access_token')
      return c.redirect('/')
   }

   return c.json(
      {
         success: true,
         fullName: getUserData[0]?.fullName,
         imageUrl: getUserData[0]?.imageUrl ?? "",
      },
      200
   );
});


session.get("/terminate", async (c) => {
   const payload: Payload = c.get("jwtPayload");
   if (payload?.role !== ROLE.USER || !payload?.userId) {
      throw new HTTPException(CODES.HTTP.UNAUTHORIZED_ACCESS, { message: "Unauthorized access" });
   }
   const updateTokenVersion = await db
          .update(UserTable)
          .set({ token_version: sql`${UserTable.token_version} + 1` })
          .where(eq(UserTable.user_id, payload.userId))
          .returning({user_id: UserTable.user_id});
      
      if(updateTokenVersion?.length === 0){
          throw new HTTPException(CODES.HTTP.BAD_REQUEST, { message: 'Logout failed'});
      }

   deleteCookie(c, 'access_token');
   return c.json({success: true}, 200)
});

export default session;
