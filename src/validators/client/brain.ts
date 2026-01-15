import { zValidator } from "@hono/zod-validator";
import { CODES } from "../../config/constants.js";
import { ZodType } from "zod";
import type { ValidationTargets } from "hono";

export function clientZodValidator<T extends ZodType>(schema: T, target: keyof ValidationTargets) {
    const validator = zValidator(target, schema, (result, c) => {
        if (!result.success) {
            const logger = c.get('logger');
            const data = result.error.issues.map((i) => ({
                field: i.path.join('.'), 
                message: i.message 
            }));
            logger.warn(data)
            return c.json(
                {
                    success: false,
                    error: {
                        code: CODES.APP.VALIDATION_FAILED,
                        message: data,
                    },
                },
                CODES.HTTP.UNPROCESSABLE_ENTITY
            );
        }
    });

    return validator;
}
