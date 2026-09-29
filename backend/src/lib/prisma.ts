import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pool?: Pool;
};

function createPrismaClient(): PrismaClient {
  const pool =
    globalForPrisma.pool ??
    new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,                    // Maximum number of connections
      idleTimeoutMillis: 30000,   // 30 seconds idle timeout
      connectionTimeoutMillis: 5000, // 5 seconds connection timeout
      statement_timeout: 30000,   // 30 seconds statement timeout
    });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
  });

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.pool = pool;
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg(pool),
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

  return prisma;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
