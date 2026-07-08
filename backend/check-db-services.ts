import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const services = await prisma.service.findMany();
  console.log('Services in database:', JSON.stringify(services, null, 2));
  console.log('Total count:', services.length);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
