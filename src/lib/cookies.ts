import 'dotenv/config'
import { Response } from 'express';
interface ICookie{
    name: string;
    res: Response,
    jwt: string;
    maxAge?: number;
}
export const sendCustomCookies = async({res, name, jwt, maxAge = 7 * 24 * 60 * 60 * 1000}: ICookie)=>{

            res.cookie(name, jwt, {
               httpOnly: true,
               secure: process.env.SITE_MODE === "production",
               sameSite: 'lax',
               maxAge: maxAge, // 7 days expiration
               path: '/',
             });

}