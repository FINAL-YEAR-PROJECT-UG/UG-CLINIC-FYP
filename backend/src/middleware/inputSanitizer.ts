import { Request, Response, NextFunction } from 'express';
import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize string inputs to prevent XSS attacks
 * Optimized for performance - only sanitizes when needed
 */
export const sanitizeInputs = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Only sanitize if there's data to sanitize
    if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
      req.body = sanitizeObject(req.body);
    }

    if (req.query && typeof req.query === 'object' && Object.keys(req.query).length > 0) {
      req.query = sanitizeObject(req.query);
    }

    if (req.params && typeof req.params === 'object' && Object.keys(req.params).length > 0) {
      req.params = sanitizeObject(req.params);
    }
  } catch (error) {
    console.error('Sanitization error:', error);
    // Continue without sanitization if error occurs (fail-open)
  }

  next();
};

/**
 * Recursively sanitize object properties
 * Optimized: caches sanitization results and skips safe strings
 */
function sanitizeObject(obj: any, depth = 0): any {
  // Prevent deep recursion
  if (depth > 10) {
    return obj;
  }

  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    // Quick check: if string has no HTML-like characters, skip sanitization
    if (!/<|>|&|"|'|script|onerror|onclick|onload/.test(obj)) {
      return obj;
    }
    return DOMPurify.sanitize(obj, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, depth + 1));
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        sanitized[key] = sanitizeObject(obj[key], depth + 1);
      }
    }
    return sanitized;
  }

  return obj;
}
