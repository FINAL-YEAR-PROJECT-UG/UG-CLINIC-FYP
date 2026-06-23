/**
 * Advanced input validation utilities
 */

/**
 * Validate and normalize UUID
 */
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
};

/**
 * Validate phone number (basic international format)
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s\-()]{7,20}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate date format and range
 */
export const isValidDateRange = (date: string, minDate?: Date, maxDate?: Date): boolean => {
  const parsedDate = new Date(date);
  
  if (isNaN(parsedDate.getTime())) {
    return false;
  }

  if (minDate && parsedDate < minDate) {
    return false;
  }

  if (maxDate && parsedDate > maxDate) {
    return false;
  }

  return true;
};

/**
 * Validate request payload size
 */
export const isValidPayloadSize = (size: number, maxSize: number = 10 * 1024 * 1024): boolean => {
  return size <= maxSize;
};

/**
 * Sanitize string length
 */
export const enforceMaxLength = (str: string, maxLength: number): string => {
  return str.substring(0, maxLength);
};

/**
 * Check for SQL-like injection patterns (defense in depth)
 */
export const containsSuspiciousPatterns = (input: string): boolean => {
  const suspiciousPatterns = [
    /(\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
    /(-{2,}|\/\*|\*\/|;|xp_|sp_)/gi,
    /(script|onclick|onerror|onload|eval|expression)/gi,
  ];

  return suspiciousPatterns.some((pattern) => pattern.test(input));
};

/**
 * Validate enum values
 */
export const isValidEnum = <T extends readonly string[]>(value: any, enumValues: T): boolean => {
  return enumValues.includes(value);
};

/**
 * Rate limit key generator
 */
export const getRateLimitKey = (req: any): string => {
  return req.ip || req.connection.remoteAddress || 'unknown';
};
