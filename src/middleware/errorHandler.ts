import { MulterError } from "multer";
import { AppError } from "../utils/AppError";
import { NextFunction, Request, Response } from "express";
import { ErrorLabel } from "../types/enums";

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
    const input = {
        emailPhone: req.body?.emailPhone
    }
    
    if (err instanceof AppError) {
        req.log.error({input, err});
        res.status(err.statusCode).json({
            message: err.message,
            error: err.error,
            isValidUser: err.isValidUser,
            success: err.success
        });
        return;
    }
    if(err instanceof MulterError){
        req.log.error({input, err});
        res.status(400).json({
            message: err.message,
            error: ErrorLabel.UPLOAD_FAILED,
            success: false
        });
        return;
    }

    req.log.fatal(err);
    res.status(500).json({
        message: "Internal server error",
        error: err.message || "Something went wrong",
        success: false
    });
    return;
}
