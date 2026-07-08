import "dotenv/config";
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

console.log("Starting debug full app...");
console.log("DATABASE_URL:", process.env.DATABASE_URL?.substring(0, 30) + "...");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("PORT:", process.env.PORT);

// Create global Prisma client
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const globalPrisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

// Test database connection
async function testDatabase() {
  try {
    console.log("Testing database connection...");
    const services = await globalPrisma.service.findMany();
    console.log("Services count:", services.length);
    console.log("Database connection test successful");
  } catch (error) {
    console.error("Database connection test failed:", error);
    process.exit(1);
  }
}

testDatabase();

const app = express();
const port = Number(process.env.PORT) || 5000;

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'ug-clinic-api' });
});

app.get('/api/services', async (_req, res) => {
  try {
    const services = await globalPrisma.service.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        duration: true,
        category: true,
      },
    });
    
    console.log("Services returned:", services.length);
    res.status(200).json({ success: true, data: { services } });
  } catch (error) {
    console.error("Error fetching services:", error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching services',
    });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on port ${port}`);
});

// Cleanup on exit
process.on('SIGINT', async () => {
  console.log('Shutting down...');
  await globalPrisma.$disconnect();
  await pool.end();
  process.exit(0);
});
