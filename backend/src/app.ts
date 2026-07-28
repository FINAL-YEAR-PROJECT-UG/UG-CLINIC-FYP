import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import morgan from 'morgan';
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

const app = express();
const port = Number(process.env.PORT) || 5000;
const isProduction = process.env.NODE_ENV === 'production';

// Security middleware - apply first
app.use(helmet());
app.use(securityHeaders);
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://10.107.9.172:3001', 'http://localhost:3001', 'http://10.107.9.172:3005', 'http://localhost:3005'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-Token'],
    maxAge: 86400,
  })
);

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan(isProduction ? 'combined' : 'dev'));

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
  });
}

export default app;
