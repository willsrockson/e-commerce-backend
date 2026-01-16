import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors"
import userRoute from "./routes/client/user-route.js";
import regionTownRoute from "./routes/client/region-town-route.js";
import categoriesRoute from "./routes/client/categories-route.js";
import { ZodError } from "zod";
import { HTTPException } from "hono/http-exception";
import { CODES, ENVIRONMENT } from "./config/constants.js";
import type { StatusCode } from "hono/utils/http-status";
import "dotenv/config";
import { pinoLogger } from "./middlewares/pino-logger.js";
import { jwt } from "hono/jwt";
import type { JwtVariables } from "hono/jwt";
import session from "./routes/client/session-route.js";
import account from "./routes/client/account-route.js";
import { JwtTokenExpired } from "hono/utils/jwt/types";
import contentMobilePhones from "./routes/client/contents/electronics/content-mobile-phones-route.js";
import postMobilePhones from "./routes/client/post-ads/electronics/post-mobile-phones-route.js";
import mobilePhonesNoAuthCatalog from "./routes/client/categories/electronics/no-auth/no-auth-mobile-phones-route.js";
import mobileCatalog from "./routes/client/categories/electronics/category-mobile-phones-route.js";
import trendingNewPost from "./routes/client/trending-new-post-route.js";
type Variables = JwtVariables;

const app = new Hono<{ Variables: Variables }>();
app.use(
  '*', 
  cors({
    origin: ['https://tonmame.store', 'http://localhost:3000', 'https://www.tonmame.store'],
    allowMethods: ['POST', 'GET', 'OPTIONS', 'DELETE', 'PUT', 'PATCH'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true
  })
)
app.use("*", pinoLogger);

app.use(
   "/api/auth/*",
   jwt({
      secret: process.env.JWT_SECRET_KEY as string,
      cookie: "access_token",
   })
);
// Client routes

// Content routes
app.route("/api/content", regionTownRoute); //TODO -- Look into why you need auth to access these two routes
app.route("/api/content", categoriesRoute);
app.route("/api/content", contentMobilePhones)

//New post and trending route
app.route("/api/homepage", trendingNewPost)

//Account user route
app.route("/api/user", userRoute);
app.route("/api/auth/session", session);
app.route("/api/auth/account", account);

//Electronics
app.route("/api/auth/post/electronics", postMobilePhones);
app.route("/api/auth/fetch", mobileCatalog);
app.route("/api/fetch", mobilePhonesNoAuthCatalog);

// Global error handler
app.onError((err, c) => {
   let code: string = "INTERNAL SERVER ERROR";
   let httpCode: StatusCode = 500;
   let message: string = "SERVER ERROR";
   const logger = c.get("logger");

   if (err instanceof HTTPException && err.status === 401) {
      logger.error(err);
      message ='Please log in to continue.',
      code = CODES.APP.AUTH_TOKEN_INVALID;
      httpCode = CODES.HTTP.NOT_FOUND;
   
  }else if (err instanceof HTTPException) {
      logger.error(err);
      code = CODES.APP.HTTP_EXCEPTION;
      httpCode = err.status ?? CODES.HTTP.BAD_REQUEST;
      message = err.message;
   } else if (err instanceof ZodError) {
      logger.error(err);
      code = CODES.APP.VALIDATION_FAILED;
      httpCode = CODES.HTTP.UNPROCESSABLE_ENTITY;
      message = err.message;
   } else if (err instanceof JwtTokenExpired) {
      logger.error(err);
      code = CODES.APP.AUTH_TOKEN_EXPIRED;
      httpCode = CODES.HTTP.NOT_FOUND;
      message = "The verification link is invalid or has expired.";
   } else if (err instanceof Error) {
      logger.error(err);
      if (process.env.NODE_ENV! === ENVIRONMENT.DEV) {
         message = err.message;
      }
   }

   return c.json(
      {
         success: false,
         error: {
            code: code,
            message: message,
         },
      },
      httpCode
   );
});

serve(
   {
      fetch: app.fetch,
      port: Number(process.env.PORT) || 5001,
   },
   (info) => {
      console.log(`Server is running on ${info.address}:${info.port}`);
   }
);
