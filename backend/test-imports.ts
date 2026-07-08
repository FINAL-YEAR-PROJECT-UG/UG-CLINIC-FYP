import 'dotenv/config';

console.log("Testing imports one by one...");

try {
  console.log("1. Express");
  import express from 'express';
  console.log("✓ Express imported");
} catch (e) {
  console.error("✗ Express failed:", e);
}

try {
  console.log("2. Cors");
  import cors from 'cors';
  console.log("✓ Cors imported");
} catch (e) {
  console.error("✗ Cors failed:", e);
}

try {
  console.log("3. Compression");
  import compression from 'compression';
  console.log("✓ Compression imported");
} catch (e) {
  console.error("✗ Compression failed:", e);
}

try {
  console.log("4. Helmet");
  import helmet from 'helmet';
  console.log("✓ Helmet imported");
} catch (e) {
  console.error("✗ Helmet failed:", e);
}

try {
  console.log("5. Morgan");
  import morgan from 'morgan';
  console.log("✓ Morgan imported");
} catch (e) {
  console.error("✗ Morgan failed:", e);
}

try {
  console.log("6. Rate limit");
  import rateLimit from 'express-rate-limit';
  console.log("✓ Rate limit imported");
} catch (e) {
  console.error("✗ Rate limit failed:", e);
}

try {
  console.log("7. Slow down");
  import slowDown from 'express-slow-down';
  console.log("✓ Slow down imported");
} catch (e) {
  console.error("✗ Slow down failed:", e);
}

try {
  console.log("8. Middleware imports");
  import notFound from './src/middleware/notFound';
  import errorHandler from './src/middleware/errorHandler';
  import { sanitizeInputs } from './src/middleware/inputSanitizer';
  import { securityHeaders } from './src/middleware/cspHeaders';
  import { logSuspiciousRequests } from './src/middleware/requestLogging';
  console.log("✓ Middleware imported");
} catch (e) {
  console.error("✗ Middleware failed:", e);
}

try {
  console.log("9. Route imports");
  import authRoutes from './src/routes/auth.routes';
  import appointmentRoutes from './src/routes/appointment.routes';
  import serviceRoutes from './src/routes/service.routes';
  import resourceRoutes from './src/routes/resource.routes';
  import adminRoutes from './src/routes/admin.routes';
  import notificationRoutes from './src/routes/notification.routes';
  import staffRoutes from './src/routes/staff.routes';
  console.log("✓ Routes imported");
} catch (e) {
  console.error("✗ Routes failed:", e);
}

console.log("All imports successful!");
