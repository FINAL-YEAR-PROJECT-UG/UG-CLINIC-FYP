import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

async function testDatabase() {
  try {
    console.log("DATABASE_URL:", process.env.DATABASE_URL?.substring(0, 30) + "...");
    const services = await prisma.service.findMany();
    console.log("Services count:", services.length);
    console.log("Services:", JSON.stringify(services, null, 2));
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

testDatabase();
