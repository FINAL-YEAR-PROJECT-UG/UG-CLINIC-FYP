import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import morgan from 'morgan';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { Pool } from 'pg';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import notFound from './middleware/notFound';
import errorHandler from './middleware/errorHandler';
import { sanitizeInputs } from './middleware/inputSanitizer';
import { securityHeaders } from './middleware/cspHeaders';
import { logSuspiciousRequests } from './middleware/requestLogging';
import authRoutes from './routes/auth.routes';
import appointmentRoutes from './routes/appointment.routes';
import serviceRoutes from './routes/service.routes';
import resourceRoutes from './routes/resource.routes';
import adminRoutes from './routes/admin.routes';
import notificationRoutes from './routes/notification.routes';
import staffRoutes from './routes/staff.routes';
import newsRoutes from './routes/news.routes';
import startSessionCleanupJob from './jobs/sessionCleanup';

const app = express();
const port = Number(process.env.PORT) || 5000;
const isProduction = process.env.NODE_ENV === 'production';

// Trust proxy for reverse proxies (Railway, Vercel, Cloudflare)
app.set('trust proxy', 1);

// Security middleware - apply first
app.use(helmet());
app.use(securityHeaders);

// CORS configuration allowing cookies from frontend origins (including Vercel domain)
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : [
      'http://10.107.9.172:3001',
      'http://localhost:3001',
      'http://10.107.9.172:3005',
      'http://localhost:3005',
      'http://localhost:3000',
    ];

if (process.env.FRONTEND_URL && !allowedOrigins.includes(process.env.FRONTEND_URL)) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const isAllowed =
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.includes('vercel.app');

      if (isAllowed) {
        return callback(null, true);
      }
      return callback(null, origin);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-Token', 'Cookie'],
    exposedHeaders: ['Set-Cookie'],
    maxAge: 86400,
  })
);

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan(isProduction ? 'combined' : 'dev'));

// Session store configuration with Postgres
const PgSession = connectPgSimple(session);
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : undefined,
});

pgPool.on('error', (err) => {
  console.error('Session PostgreSQL pool error:', err);
});

const sessionStore = new PgSession({
  pool: pgPool,
  tableName: 'session',
  createTableIfMissing: true,
});

app.use(
  session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'ug-clinic-default-session-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    name: 'connect.sid',
    cookie: {
      secure: isProduction,          // true in prod (HTTPS), false in dev (HTTP)
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: isProduction ? 'none' : 'lax', // 'none' requires secure:true
    },
  })
);

// Set request timeout to 30 seconds
app.use((req, res, next) => {
  req.setTimeout(30000);
  res.setTimeout(30000);
  next();
});

// Input sanitization and logging
app.use(sanitizeInputs);
app.use(logSuspiciousRequests);

// Rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later',
  skip: (req) => req.path === '/health', // Skip rate limit for health checks
});
app.use(globalLimiter);

const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 50,
  delayMs: () => 500,
});
app.use(speedLimiter);

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'ug-clinic-api' });
});

app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/news', newsRoutes);

app.use(notFound);
app.use(errorHandler);

if (require.main === module) {
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on port ${port}`);

    // Start session cleanup job in production
    if (process.env.NODE_ENV === 'production') {
      startSessionCleanupJob();
    }
  });
}

export default app;
