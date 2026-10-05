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
import devEmailRoutes from './routes/devEmail.routes';
import startSessionCleanupJob from './jobs/sessionCleanup';
import { verifyTransporterConnection } from './services/email.service';


const app = express();
const port = Number(process.env.PORT) || 5000;
const isProduction = process.env.NODE_ENV === 'production';
const databaseUrl = process.env.DATABASE_URL;
const sessionSecret = process.env.SESSION_SECRET;

if (isProduction && !databaseUrl) {
  throw new Error('DATABASE_URL must be set in production');
}

if (isProduction && !sessionSecret) {
  throw new Error('SESSION_SECRET must be set in production');
}

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
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Origin is not allowed by CORS'));
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
  connectionString: databaseUrl,
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
    secret: sessionSecret || 'local-development-session-secret',
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
console.log('Request timeout middleware applied');

// Input sanitization and logging
app.use(sanitizeInputs);
console.log('Input sanitization applied');
app.use(logSuspiciousRequests);
console.log('Request logging applied');

// Rate limiting
console.log('Setting up rate limiting...');
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later',
  skip: (req) => req.path === '/health', // Skip rate limit for health checks
});
app.use(globalLimiter);
console.log('Global rate limiter applied');

const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 50,
  delayMs: () => 500,
});
app.use(speedLimiter);
console.log('Speed limiter applied');

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'ug-clinic-api' });
});
console.log('Health route registered');

console.log('Registering API routes...');
app.use('/api/auth', authRoutes);
console.log('Auth routes registered');
app.use('/api/appointments', appointmentRoutes);
console.log('Appointment routes registered');
app.use('/api/services', serviceRoutes);
console.log('Service routes registered');
app.use('/api/resources', resourceRoutes);
console.log('Resource routes registered');
app.use('/api/admin', adminRoutes);
console.log('Admin routes registered');
app.use('/api/notifications', notificationRoutes);
console.log('Notification routes registered');
app.use('/api/staff', staffRoutes);
console.log('Staff routes registered');
app.use('/api/news', newsRoutes);
console.log('News routes registered');
// Localhost email delivery testing and interactive preview dashboard
app.use('/api/dev/email', devEmailRoutes);
app.use('/dev/email', devEmailRoutes);
console.log('Dev email routes registered');

app.use(notFound);
console.log('Not found middleware applied');
app.use(errorHandler);
console.log('Error handler applied');

if (require.main === module) {
  console.log('Starting server...');
  console.log('Port:', port);
  try {
    const server = app.listen(port, '0.0.0.0', () => {
      console.log(`Server listening on port ${port}`);

      // Check email service transporter connectivity
      verifyTransporterConnection().catch((err) =>
        console.warn('[EmailService] Transporter startup check failed:', err)
      );

      // Start session cleanup job in production
      // Temporarily disabled for debugging
      // if (process.env.NODE_ENV === 'production') {
      //   startSessionCleanupJob();
      // }
    });

    server.on('error', (error) => {
      console.error('Server error:', error);
      process.exit(1);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

export default app;
