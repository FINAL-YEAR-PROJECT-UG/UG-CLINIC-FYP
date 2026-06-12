import express from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import dotenv from 'dotenv';
import notFound from './middleware/notFound';
import errorHandler from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import appointmentRoutes from './routes/appointment.routes';
import serviceRoutes from './routes/service.routes';
import resourceRoutes from './routes/resource.routes';
import adminRoutes from './routes/admin.routes';
import notificationRoutes from './routes/notification.routes';
import staffRoutes from './routes/staff.routes';

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 5000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',') || true,
    credentials: true,
  })
);
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(isProduction ? 'combined' : 'dev'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

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

app.use(notFound);
app.use(errorHandler);

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

export default app;
