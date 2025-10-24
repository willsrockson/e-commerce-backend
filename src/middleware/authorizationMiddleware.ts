import { Request, Response, NextFunction } from "express";
import { JWTPayload, jwtVerify } from "jose";
import db from "../config/db/connection/dbConnection";
import { UserTable } from "../config/db/schema/user.schema";
import { eq } from "drizzle-orm";
import myCacheSystem from "../lib/nodeCache";
import { clearCustomCookies } from "../lib/cookies";

// Extends Request to be able to add custom obj to the Request body
interface AddCustomID extends JWTPayload {
    user_id?: string;
}
export interface AuthRequest extends Request {
    userData?: {
        isValidUser: boolean;
        userID: AddCustomID;
    };
}

interface JWTAddedTypes extends JWTPayload {
    user_id?: string;
    token_version?: number;
}

interface AuthCookies {
    access_token?: string;
}

export const authorizationMiddleware = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const now = new Date()
    try {
        const getCookiesFromBrowser: AuthCookies = req.cookies;

        if (!getCookiesFromBrowser.access_token?.trim()) {
            throw new Error("Unauthorized user");
        }

        const decodedAccessToken = await jwtVerify<JWTAddedTypes>(
            getCookiesFromBrowser.access_token,
            new TextEncoder().encode(`${process.env.JWT_SECRET_KEY}`)
        );

        if (
            decodedAccessToken.payload.token_version ===
            Number(myCacheSystem.get(`${decodedAccessToken.payload.user_id}`))
        ) {
            req.userData = { isValidUser: true, userID: decodedAccessToken.payload };
            next();
            return;
        } else if (decodedAccessToken.payload.user_id) {
            const setAnotherCache = await db
                .select({ user_id: UserTable.user_id, token_version: UserTable.token_version })
                .from(UserTable)
                .where(eq(UserTable.user_id, decodedAccessToken.payload.user_id));

            if (setAnotherCache.length === 0) {
                await clearCustomCookies({
                    name: "access_token",
                    errorMessage: null,
                    res: res,
                });

                return;
            }
            if (setAnotherCache[0].token_version !== decodedAccessToken.payload.token_version) {
                await clearCustomCookies({
                    name: "access_token",
                    errorMessage: null,
                    res: res,
                });

                return;
            }
            myCacheSystem.set(
                decodedAccessToken.payload.user_id,
                setAnotherCache[0].token_version,
                3600
            );
            console.log(now.toLocaleTimeString(), "Login cache successfully set");
            req.userData = { isValidUser: true, userID: decodedAccessToken.payload };
            next();
            return;
        }
    } catch (err) {
        if (err instanceof Error) {
            await clearCustomCookies({
                name: "access_token",
                errorMessage: err.message,
                res: res,
            });
            return;
        }
    }
};
