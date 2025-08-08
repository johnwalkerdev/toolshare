import { Request, Response, NextFunction } from 'express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { logger } from '@/utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

/**
 * Global error handling middleware
 */
export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal Server Error';
  let details: any = null;

  // Log the error
  logger.error(`Error ${statusCode}: ${message}`, {
    error: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    user: req.user?.id || 'anonymous'
  });

  // Handle Prisma errors
  if (error instanceof PrismaClientKnownRequestError) {
    const prismaError = handlePrismaError(error);
    statusCode = prismaError.statusCode;
    message = prismaError.message;
    details = prismaError.details;
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error';
    details = error.message;
  }

  // Handle multer errors (file upload)
  if (error.name === 'MulterError') {
    statusCode = 400;
    message = `File upload error: ${error.message}`;
  }

  // Don't leak error details in production
  const errorResponse: any = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  };

  // Add error details in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.details = details;
    errorResponse.stack = error.stack;
  }

  // Add request ID if available
  if (req.headers['x-request-id']) {
    errorResponse.requestId = req.headers['x-request-id'];
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * Handle Prisma-specific errors
 */
const handlePrismaError = (error: PrismaClientKnownRequestError): {
  statusCode: number;
  message: string;
  details?: any;
} => {
  switch (error.code) {
    case 'P2002':
      // Unique constraint violation
      const field = error.meta?.target as string[];
      return {
        statusCode: 409,
        message: `Duplicate value for ${field?.join(', ') || 'field'}`,
        details: {
          field: field?.[0] || 'unknown',
          code: 'DUPLICATE_ENTRY'
        }
      };

    case 'P2014':
      // Invalid ID
      return {
        statusCode: 400,
        message: 'Invalid ID provided',
        details: {
          code: 'INVALID_ID'
        }
      };

    case 'P2025':
      // Record not found
      return {
        statusCode: 404,
        message: 'Record not found',
        details: {
          code: 'NOT_FOUND'
        }
      };

    case 'P2003':
      // Foreign key constraint violation
      return {
        statusCode: 400,
        message: 'Invalid reference to related record',
        details: {
          field: error.meta?.field_name,
          code: 'FOREIGN_KEY_VIOLATION'
        }
      };

    case 'P2016':
      // Query interpretation error
      return {
        statusCode: 400,
        message: 'Invalid query parameters',
        details: {
          code: 'INVALID_QUERY'
        }
      };

    case 'P1008':
      // Timeout
      return {
        statusCode: 408,
        message: 'Database operation timed out',
        details: {
          code: 'TIMEOUT'
        }
      };

    default:
      return {
        statusCode: 500,
        message: 'Database error occurred',
        details: {
          code: error.code,
          meta: error.meta
        }
      };
  }
};

/**
 * Async error wrapper
 * Catches async errors and passes them to error handler
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Create operational error
 */
export const createError = (message: string, statusCode: number = 500): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

/**
 * 404 Not Found handler
 */
export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = createError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};