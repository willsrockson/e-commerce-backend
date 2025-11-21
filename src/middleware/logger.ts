import "dotenv/config"
import Jwt from "jsonwebtoken";
import pinoHttp from "pino-http";
import pino from "pino";
import crypto from "crypto";

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


 const logger = pino(
     {
         level: process.env.PINO_LOG_LEVEL || "info",
         timestamp: pino.stdTimeFunctions.isoTime,
     },
     transport
 );

const pinoHttpLogger = pinoHttp({
    serializers:{
      req: (req) =>{
        const cookies = req.headers.cookie ?? "";
        const match = cookies.match(/access_token=([^;]+)/);
        const token = match ? match[1] : ""; 

        const header = req.headers;
        console.log(header);
        
        
        return{
            requestId: crypto.randomUUID(),
            method: req.method,
            url: req.url,
            userIpAddress: req.remoteAddress,
            userAgent: req.headers["user-agent"],
            userId: getUserId(token)
        }
      },
      res: (res) => {
        return{
            statusCode: res.statusCode,
        }
      } 
    },
    logger
})

export const getUserId = (token: string)=>{
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

export default pinoHttpLogger;

