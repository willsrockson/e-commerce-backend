export class AppError extends Error {
  readonly statusCode: number;
  readonly error: string;
  readonly success: boolean;
  readonly isValidUser: boolean;

  constructor(statusCode: number, message: string, error: string, isValidUser: boolean = false, success: boolean = false) {
    super(message);
    this.statusCode = statusCode;
    this.error = error;
    this.isValidUser = isValidUser;
    this.success = success;
    
    Error.captureStackTrace(this, this.constructor);
  }
}
