import { Request, Response, NextFunction } from 'express';

// Async route handler wrapper to catch errors
export function asyncHandler<T extends Request = Request, U extends Response = Response>(
  fn: (req: T, res: U, next: NextFunction) => Promise<any>
) {
  return (req: T, res: U, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Enhanced standardized error response structure
export interface ErrorResponse {
  error: string;
  message: string;
  status: number;
  timestamp: string;
  path?: string;
  details?: any;
}

export function createErrorResponse(
  error: string, 
  message: string, 
  status: number = 500,
  path?: string,
  details?: any
): ErrorResponse {
  return { 
    error, 
    message, 
    status,
    timestamp: new Date().toISOString(),
    path,
    details: process.env.NODE_ENV === 'development' ? details : undefined
  };
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

export function handleUnauthorized(message: string = 'Unauthorized'): never {
  throw new ApiError(message, 401);
}

export function handleForbidden(message: string = 'Forbidden'): never {
  throw new ApiError(message, 403);
}

export function handleRateLimit(message: string = 'Too many requests'): never {
  throw new ApiError(message, 429);
}

export function handleServerError(message: string = 'Internal server error'): never {
  throw new ApiError(message, 500);
}

export function handleBadGateway(message: string = 'Bad gateway'): never {
  throw new ApiError(message, 502);
}

export function handleServiceUnavailable(message: string = 'Service unavailable'): never {
  throw new ApiError(message, 503);
}