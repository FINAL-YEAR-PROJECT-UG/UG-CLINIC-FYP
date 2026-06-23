# Security Implementation Guide

## Overview
This document outlines the security measures implemented in the UG Clinic Backend to protect against common web vulnerabilities.

## Security Features Implemented

### 1. Input Validation & Sanitization
**Files:** `src/middleware/inputSanitizer.ts`, `src/utils/validation.ts`

- XSS Prevention: All string inputs are sanitized using DOMPurify
- Pattern Detection: Detects SQL injection-like patterns and suspicious inputs
- Type Validation: Strict validation of UUIDs, emails, phone numbers, and dates
- Request Payload Limits: 10MB limit on JSON and form data

**Usage:**
```typescript
// Applied globally to all requests
app.use(sanitizeInputs);
```

### 2. SQL Injection Prevention
**Implementation:** Prisma ORM with parameterized queries

- No raw SQL queries allowed in codebase (use `prisma.$queryRaw()` only with extreme caution)
- All database interactions use Prisma's type-safe query builder
- Database driver configured with SSL in production

### 3. Cross-Site Scripting (XSS) Protection
**Files:** `src/middleware/cspHeaders.ts`

- Content Security Policy (CSP) headers enforce strict script origins
- X-XSS-Protection header enabled
- X-Content-Type-Options set to 'nosniff' prevents MIME-type sniffing
- DOM sanitization on all user inputs

### 4. Authentication & Authorization
**Files:** `src/middleware/auth.ts`, `src/middleware/rbac.ts`

- JWT-based authentication with 15-minute access token expiry
- Refresh tokens stored in database with revocation tracking
- Role-Based Access Control (RBAC) for 4 roles: STUDENT, RECEPTIONIST, DOCTOR, ADMIN
- Session management with configurable concurrent session limits (default: 3)
- Account lockout after 5 failed login attempts (30-minute cooldown)

### 5. Rate Limiting & Throttling
**Files:** `src/middleware/rateLimitByEndpoint.ts`

- Global rate limiter: 100 requests per 15 minutes
- Auth endpoints: 5 login attempts per 15 minutes
- OTP endpoints: 3 attempts per 5 minutes
- Registration: 5 registrations per hour per IP
- Password reset: 3 attempts per hour per IP
- Request throttling: 50 requests/15min with 500ms delay after threshold

### 6. Password Security
**Files:** `src/utils/password.ts`

- Bcrypt hashing with configurable rounds (default: 12)
- Strong password requirements:
  - Minimum 8 characters
  - At least 1 uppercase letter
  - At least 1 lowercase letter
  - At least 1 number
  - At least 1 special character
- Password comparison using bcrypt.compare() (timing-safe)

### 7. CORS & CSRF Protection
**Implementation:** Express CORS with strict configuration

- Whitelist approved origins in `CORS_ORIGIN` environment variable
- Credentials allowed only from approved origins
- Restricted HTTP methods: GET, POST, PUT, DELETE, PATCH
- Custom header allowlist: Content-Type, Authorization, X-Session-Token
- Preflight max age: 24 hours

### 8. Security Headers
**File:** `src/middleware/cspHeaders.ts`

- Content-Security-Policy: Strict policy preventing inline scripts
- X-Frame-Options: DENY (prevents clickjacking)
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: Blocks geolocation, microphone, camera, payment APIs

### 9. Error Handling & Information Disclosure
**File:** `src/middleware/errorHandler.ts`

- Error ID generation for tracking (ERR-{timestamp}-{random})
- Stack traces exposed only in development mode
- Generic error messages in production (prevents info leakage)
- All errors logged with context (user, IP, path, method)

### 10. Audit Logging & Monitoring
**File:** `src/middleware/requestLogging.ts`

- Winston logger configured with multiple transports
- Separate log files for errors, security events, and exceptions
- Logs capture: timestamp, user ID, IP address, user agent, method, path, status code
- Security events logged: failed logins, failed OTP attempts, suspicious patterns

### 11. Two-Factor Authentication (2FA)
**Implementation:** OTP via SMS for staff accounts

- OTP generation and expiration (10 minutes)
- SMS delivery via Twilio
- Rate limited: 3 OTP requests per 5 minutes
- OTP marked as used after consumption
- Configurable per user

### 12. Session Management
**Database Model:** `Session` in Prisma schema

- Session tokens stored server-side with revocation tracking
- Session expiry configurable (default: 30 minutes)
- Concurrent session limit per user (default: 3)
- IP address and User-Agent tracking for session validation
- Automatic session revocation on logout or token refresh

### 13. Data Protection
**Implementation:** Prisma with encrypted connections

- Database connections use SSL/TLS in production
- Sensitive data (passwords) never logged
- Audit logs capture changes (oldValue, newValue) as JSON
- User data selectively returned (passwords never exposed)

## Environment Variables Configuration

See `.env.example` for all required configuration. Critical settings:

```env
# MUST be changed in production
JWT_SECRET=change-this-to-a-strong-random-string

# Database
DATABASE_URL=postgresql://user:pass@host/dbname

# CORS
CORS_ORIGIN=https://yourdomain.com

# Email & SMS
SMTP_HOST=smtp.gmail.com
TWILIO_ACCOUNT_SID=your-sid
```

## Security Checklist

- [x] Input validation & sanitization
- [x] SQL injection prevention (Prisma ORM)
- [x] XSS protection (CSP, sanitization)
- [x] CSRF prevention (CORS, SameSite)
- [x] Authentication & authorization (JWT + RBAC)
- [x] Rate limiting per endpoint
- [x] Strong password requirements
- [x] Secure password hashing (Bcrypt)
- [x] Account lockout mechanism
- [x] Session management with revocation
- [x] Two-factor authentication (2FA)
- [x] Audit logging
- [x] Error handling (no info disclosure)
- [x] Security headers (CSP, HSTS, etc.)
- [x] CORS whitelist
- [x] Data encryption in transit (SSL/TLS)

## Deployment Recommendations

### Production Environment
```env
NODE_ENV=production
HELMET_ENABLED=true
INPUT_SANITIZATION_ENABLED=true
SECURITY_LOG_ENABLED=true
BCRYPT_ROUNDS=14
JWT_SECRET={generate-strong-32-char-secret}
CORS_ORIGIN={whitelist-your-frontend-domain}
```

### Regular Maintenance
1. **Update Dependencies:** `npm audit fix` and `npm update` monthly
2. **Rotate Secrets:** Change JWT_SECRET every 3-6 months
3. **Review Logs:** Check security logs weekly for suspicious activity
4. **Penetration Testing:** Conduct security audits quarterly
5. **Backup Strategy:** Regular encrypted backups of production database

## Known Limitations & Future Improvements

1. Add API key authentication for third-party integrations
2. Implement API versioning to manage changes securely
3. Add request signing for high-value operations
4. Implement certificate pinning for mobile clients
5. Add database activity monitoring (DAM)
6. Implement secrets rotation automation
7. Add threat detection/IDS capabilities
8. Implement zero-trust security model

## Security Incident Response

In case of a suspected security breach:
1. Check audit logs in `logs/security.log`
2. Review failed login attempts and invalid OTP attempts
3. Invalidate compromised sessions via admin panel
4. Force password reset for affected users
5. Review CORS and rate limit configurations
6. Check for suspicious file uploads
7. Report to security team and affected users

## References

- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Express.js Security Best Practices: https://expressjs.com/en/advanced/best-practice-security.html
- JWT Best Practices: https://tools.ietf.org/html/rfc8725
- PostgreSQL Security: https://www.postgresql.org/docs/current/sql-syntax.html
