import { sign } from "hono/jwt";
import { AUTH_JWT_EXPIRY, EMAIL_JWT_EXPIRY } from "../../config/constants.js";
import type { JwtEmailSign, JwtSign, EmailVCache} from "../../types/client/types.js";
import 'dotenv/config'
import clientCache from "./node-cache.js";
import { EmailClient } from "./email-client.js";
import cloudinary from "./cloudinary.js";
import { Readable } from "stream";
import crypto from "crypto";


export const FormatGhanaCedi = (amount: number) => {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS'
  }).format(amount);
};

export const SignToken = async ({ userId, role, tokenVersion }: JwtSign): Promise<string> => {
   return await sign(
      {
         userId: userId,
         role: role,
         tokenVersion: tokenVersion,
         exp: AUTH_JWT_EXPIRY, // 24hrs
      },
      `${process.env.JWT_SECRET_KEY}`,
      "HS256"
   );
};

export const SignEmailToken = async ({ userId, role }: JwtEmailSign): Promise<string> => {
   return await sign(
      {
         userId: userId,
         role: role,
         exp: EMAIL_JWT_EXPIRY, // 15 minutes
      },
      `${process.env.EMAIL_JWT_SECRET_KEY}`,
      "HS256"
   );
};

export function GenerateSixDigitCode(): number {
  return Math.floor(100000 + Math.random() * 900000);
}




export const EmailVerificationWithCache = async ({ to, subject, html, wantCache, userId, cacheValue, ttl }: EmailVCache): Promise<string> => {

    const emailSuccess = await EmailClient(to, subject, html)
         if (wantCache && userId) {
            const success = clientCache.set(userId, cacheValue , ttl); // 300 = 5 minutes
            if (!success) {
               throw new Error("Cache creating failed");
            }
         }
    return emailSuccess;      
}


export const HashUserId = (input: string) => {
   return crypto
      .createHash("sha256")
      .update(input)
      .digest("hex");
};


/* 
uploadStream ( The Drain ): When you call cloudinary.uploader.upload_stream(...),
it doesn't upload anything yet. It just opens a "drain" to Cloudinary's servers and waits. 
It returns a Writable Stream object that we saved in the variable uploadStream.
stream ( The Water Source ): Your file is currently a static block of memory (Buffer). 
Readable.from(fileBuffer) turns that solid block into a flow of water (a Readable Stream).
.pipe() ( The Connector ): This is the magic link.
*/
export const UploadToCloudinary = async (fileBuffer: Buffer, folder: string, fileName?: string) => {

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        public_id: fileName, // Optional: Use for avatars to overwrite
        overwrite: !!fileName,
        resource_type: "image", // Auto-detect image/video
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    // Convert Buffer to a Readable Stream and pipe it to Cloudinary
    const stream = Readable.from(fileBuffer);
    stream.pipe(uploadStream);
  });
};


export const deleteImages = async (ids: string[]): Promise<{result: string}[] | []> => {
   try {
      if(ids.length === 0) return [];
      const deletePromises = ids.map((id) =>
         cloudinary.uploader.destroy(id, {
            invalidate: true,
            resource_type: "image",
         })
      );
      const results = await Promise.all(deletePromises);
      return results;
   } catch (error) {
      if (error instanceof Error) {
         throw new Error("Error deleting images");
      }
      throw new Error("Error deleting images");
   }
};

