import { Request, Response, NextFunction } from 'express';

// Async route handler wrapper to catch errors
export function asyncHandler<T extends Request = Request, U extends Response = Response>(
  fn: (req: T, res: U, next: NextFunction) => Promise<any>
) {
  return (req: T, res: U, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Standardized error response structure
export interface ErrorResponse {
  error: string;
  message: string;
  status?: number;
}

export function createErrorResponse(
  error: string, 
  message: string, 
  status: number = 500
): ErrorResponse & { status: number } {
  return { error, message, status };
}

// Common error handling patterns
export class ApiError extends Error {
  status: number;
  
  constructor(message: string, status: number = 500) {
    super(message);
    this.status = status;
  }
}

export function handleNotFound(message: string = 'Resource not found'): never {
  throw new ApiError(message, 404);
}

export function handleBadRequest(message: string = 'Bad request'): never {
  throw new ApiError(message, 400);
}

export function handleServerError(message: string = 'Internal server error'): never {
  throw new ApiError(message, 500);
}