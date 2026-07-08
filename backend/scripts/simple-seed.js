require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

async function main() {
  console.log('Checking services...');
  const services = await prisma.service.findMany();
  console.log('Current services:', services);

  if (services.length === 0) {
    console.log('Creating services...');
    await prisma.service.createMany({
      data: [
        {
          name: "General Consultation",
          description: "Routine medical consultation with a clinic physician",
          duration: 30,
          category: "General Medicine",
          isActive: true,
        },
        {
          name: "Dental Checkup",
          description: "Comprehensive dental examination and oral health assessment",
          duration: 45,
          category: "Dental",
          isActive: true,
        },
        {
          name: "Eye Examination",
          description: "Vision screening and basic eye health evaluation",
          duration: 30,
          category: "Ophthalmology",
          isActive: true,
        },
      ],
    });
    console.log('Services created!');
  } else {
    console.log('Services already exist');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
