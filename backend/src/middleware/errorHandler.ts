import { NextFunction, Request, Response } from 'express';
import { logger } from './requestLogging';

interface ErrorResponse {
  success: boolean;
  message: string;
  errorId?: string;
  [key: string]: any;
}

const errorHandler = (
  err: Error & { statusCode?: number; isOperational?: boolean },
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Generate error ID for tracking
  const errorId = `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  // Log error with security context
  logger.error({
    errorId,
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: (req as any).user?.userId,
    statusCode,
    timestamp: new Date().toISOString(),
  });

  // Prepare error response
  const errorResponse: ErrorResponse = {
    success: false,
    message: isProduction && statusCode === 500
      ? 'An internal server error occurred'
      : err.message || 'Something went wrong',
    errorId,
  };

  // Include stack trace only in development
  if (!isProduction && err.stack) {
    errorResponse.stack = err.stack;
  }

  // Don't expose internal error details in production
  if (isProduction && statusCode === 500) {
    return res.status(statusCode).json(errorResponse);
  }

  res.status(statusCode).json(errorResponse);
};

export default errorHandler;
