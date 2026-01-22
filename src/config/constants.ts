export const CODES = {

  HTTP: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED_ACCESS: 401,     // Not logged in
    FORBIDDEN: 403,        // Logged in, but no permission
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    CONFLICT: 409,         // Duplicate email, etc.
    UNPROCESSABLE_ENTITY: 422, // Zod validation failure
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
    BODY_IS_TOO_LARGE: 413,
  },

  APP: {
    // Auth Errors
    AUTH_INVALID_CREDENTIALS: "AUTH_INVALID_CREDENTIALS",
    AUTH_USER_NOT_FOUND: "AUTH_USER_NOT_FOUND",
    AUTH_EMAIL_ALREADY_EXISTS: "AUTH_EMAIL_ALREADY_EXISTS",
    AUTH_TOKEN_EXPIRED: "AUTH_TOKEN_EXPIRED",
    AUTH_TOKEN_INVALID: "AUTH_TOKEN_INVALID",
    AUTH_MISSING_HEADER: "AUTH_MISSING_HEADER",
    RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",
    RESOURCE_ALREADY_EXISTS: "RESOURCE_ALREADY_EXISTS",
    ACCESS_DENIED: "ACCESS_DENIED",
    INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS",
    VALIDATION_FAILED: "VALIDATION_FAILED",
    INVALID_INPUT: "INVALID_INPUT",
    SERVER_ERROR: "SERVER_ERROR",
    DATABASE_ERROR: "DATABASE_ERROR",
    HTTP_EXCEPTION: "HTTP_EXCEPTION"
  },

  MYSQL: {
    ER_DUP_ENTRY: "ER_DUP_ENTRY",         // Code: 1062 (Duplicate Key)
    ER_NO_REFERENCED_ROW: "ER_NO_REFERENCED_ROW_2", // Code: 1452 (Foreign Key Missing)
    ER_ROW_IS_REFERENCED: "ER_ROW_IS_REFERENCED_2", // Code: 1451 (Cannot delete parent)
    ER_BAD_FIELD_ERROR: "ER_BAD_FIELD_ERROR", // Code: 1054 (Column doesn't exist)
    ER_PARSE_ERROR: "ER_PARSE_ERROR",     // Code: 1064 (SQL Syntax error)
    ER_ACCESS_DENIED_ERROR: "ER_ACCESS_DENIED_ERROR", // Code: 1045 (Bad DB password)
    ER_CON_COUNT_ERROR: "ER_CON_COUNT_ERROR", // Code: 1040 (Too many connections)
  },

} as const;

export const ENVIRONMENT = {
    PROD: "production",
    DEV: "development"
} as const;

export const AUTH_PROVIDER_NAME = {
      GOOGLE: 'google'
} as const

export const ROLE = {
   USER: 'user',
   MODERATOR: 'moderator',
   SUPERUSER: 'superuser'
}
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24; //24hrs

export const AUTH_JWT_EXPIRY = Math.floor(Date.now() / 1000) + 60 * 60 * 24; //24hrs
export const EMAIL_JWT_EXPIRY = Math.floor(Date.now() / 1000) + 60 * 15; //15min

// Email subject
export const EMAIL_SUBJECTS = {
    VERIFY_EMAIL: "Verify your email",
    VERIFY_PHONE_NUMBER: "Verify your phone number",
    VERIFICATION_CODE: "Tonmame - confirmation code"
} as const;

export const APP = {
   NAME: "Tonmame"
} as const;

export const GH_PHONE_NUMBER_REGEX = /^(023|024|025|026|027|028|050|053|054|055|056|057|059|020)\d{7}$/;
export const SIX_DIGIT_CODE_REGEX = /^\d{6}$/;
export const OPEN_HOURS_REGEX = /^([A-Za-z]{3})(?:\s*-\s*([A-Za-z]{3}))?\s*\((.+?)\s*-\s*(.+?)\)$/;


export const CATEGORIES = {
   MAIN: {
    ELECTRONICS: "Electronics"
   },
   SUB: {
     ELECTRONICS: {
       MOBILE_PHONES: "Mobile Phones"
     }
   }
} as const;
