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

async function checkAndCreateServices() {
  try {
    console.log("Checking existing services...");
    const existingServices = await prisma.service.findMany();
    console.log(`Found ${existingServices.length} services:`, existingServices);

    if (existingServices.length === 0) {
      console.log("No services found. Creating services...");
      
      const services = await prisma.$transaction([
        prisma.service.create({
          data: {
            name: "General Consultation",
            description: "Routine medical consultation with a clinic physician",
            duration: 30,
            category: "General Medicine",
            isActive: true,
          },
        }),
        prisma.service.create({
          data: {
            name: "Dental Checkup",
            description: "Comprehensive dental examination and oral health assessment",
            duration: 45,
            category: "Dental",
            isActive: true,
          },
        }),
        prisma.service.create({
          data: {
            name: "Eye Examination",
            description: "Vision screening and basic eye health evaluation",
            duration: 30,
            category: "Ophthalmology",
            isActive: true,
          },
        }),
      ]);

      console.log("Services created successfully:", services);
    } else {
      console.log("Services already exist in database.");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

checkAndCreateServices();
