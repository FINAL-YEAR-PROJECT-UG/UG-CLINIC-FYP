import { Request, Response, NextFunction } from 'express';
import winston from 'winston';

/**
 * Security event logging for audit trail
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/security.log' }),
  ],
  exceptionHandlers: [new winston.transports.File({ filename: 'logs/exceptions.log' })],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

/**
 * Log security events
 */
export const logSecurityEvent = (
  eventType: string,
  userId: string | null,
  ipAddress: string | null | undefined,
  details: any
) => {
  logger.info({
    eventType,
    userId,
    ipAddress: ipAddress || null,
    timestamp: new Date().toISOString(),
    ...details,
  });
};

/**
 * Middleware to log suspicious requests
 */
export const logSuspiciousRequests = (req: Request, res: Response, next: NextFunction) => {
  // Store original send method
  const originalSend = res.send;

  // Override send to log errors
  res.send = function (data: any) {
    if (res.statusCode >= 400 && res.statusCode < 500) {
      logSecurityEvent('HTTP_ERROR', null, req.ip, {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        userAgent: req.get('user-agent'),
      });
    }
    return originalSend.call(this, data);
  };

  next();
};

export { logger };
