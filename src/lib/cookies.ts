import "dotenv/config";
import { Response } from "express";
import { Environment } from "../types/enums";
interface Cookies {
    name: string;
    res: Response;
    jwt: string;
    maxAge?: number;
}
interface RemoveCookies extends Pick<Cookies, 'name' | 'res'>{
    errorMessage: string | null;
    isValidUser?: boolean
}
export const sendCustomCookies = async ({
    res,
    name,
    jwt,
    maxAge = 7 * 24 * 60 * 60 * 1000,
}: Cookies) => {
    res.cookie(name, jwt, {
        httpOnly: true,
        secure: process.env.NODE_ENV === Environment.PRODUCTION,
        sameSite: "lax",
        maxAge: maxAge, // 7 days expiration
        path: "/",
    });
};


export const clearCustomCookies = async ({
    name,
    res,
    errorMessage = null,
    isValidUser = false,
}: RemoveCookies) => {
    res.clearCookie(name, {
        httpOnly: true,
        secure: process.env.NODE_ENV === Environment.PRODUCTION,
        sameSite: "lax",
    });
    res.status(401).json({ errorMessage: errorMessage, isValidUser: isValidUser });
};
