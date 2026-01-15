import { bodyLimit } from "hono/body-limit";
import { HTTPException } from "hono/http-exception";
import { CODES } from "../config/constants.js";


const fileLimitMiddleware = bodyLimit({
  maxSize: 5 * 1024 * 1024, // 5MB
  onError: (c) => {
    throw new HTTPException(CODES.HTTP.BODY_IS_TOO_LARGE,{message:'File is too large!'})
  },
})

export default fileLimitMiddleware;