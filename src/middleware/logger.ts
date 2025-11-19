import "dotenv/config"
import Jwt from "jsonwebtoken";
import pino from "pino";
import PinoHttp from "pino-http";
import { Request } from "express";
const transport = pino.transport({
     targets: [
        //  {
        //      target: "pino-pretty",
        //      options: { destination: "./logs/output.log", mkdir: true, colorize: false },
        //  },
         {
            target: "pino-pretty",
            options: { destination: process.stdout.fd },
         }
     ],
 });

const pinoLogger = PinoHttp(
    {
        genReqId: () => require("crypto").randomUUID(),
        quietReqLogger: true,
        serializers: {
            req: (req: Request) => {
                const cookies = req.headers.cookie ?? "";
                const match = cookies.match(/access_token=([^;]+)/);
                const token = match ? match[1] : "";
                
                return {
                    method: req.method,
                    url: req.url,
                    user_ip: req.ips || req.socket?.remoteAddress,
                    user_agent: req.headers["user-agent"],
                    user_id: getUserId(token)
                };
            },
            res: (res) => ({
                statusCode: res.statusCode,
            }),
        },
        customAttributeKeys: {
            req: "request",
            res: "response",
            responseTime: "time_taken_ms",
        },
        level: process.env.LOG_LEVEL || "info",
    },
    transport,
);

const getUserId = (token: string)=>{
         if(!token){
            return {
             id: "guest",
             token_version: "guest"
            }
         }
         const user = Jwt.verify(token, `${process.env.JWT_SECRET_KEY}`) as { user_id: string, token_version: string| number }
         if(!user){
           return {
             id: "guest",
             token_version: "guest"
            }  
         }
         return {
             id: user?.user_id,
             token_version: user?.token_version
         }  
}


export default pinoLogger;
