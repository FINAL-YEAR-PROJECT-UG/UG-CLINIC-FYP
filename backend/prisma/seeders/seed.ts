import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";
import { PrismaClient, UserRole } from "@prisma/client";
import { Pool } from "pg";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});
const BCRYPT_ROUNDS = 12;
const DEFAULT_PASSWORD = "Password123!";

function getTomorrow(): Date {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
}

function formatTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

function generateTimeSlots(
  serviceId: string,
  date: Date,
  durationMinutes: number,
  startHour = 8,
  endHour = 17
) {
  const slots = [];
  let currentMinutes = startHour * 60;
  const endMinutes = endHour * 60;

  while (currentMinutes + durationMinutes <= endMinutes) {
    slots.push({
      serviceId,
      date,
      startTime: formatTime(currentMinutes),
      endTime: formatTime(currentMinutes + durationMinutes),
      isAvailable: true,
      maxBookings: 1,
      currentBookings: 0,
    });
    currentMinutes += durationMinutes;
  }

  return slots;
}

async function clearExistingData(): Promise<void> {
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.timeSlot.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.service.deleteMany();
  await prisma.user.deleteMany();
}

export async function seed(): Promise<void> {
  console.log("Clearing existing data...");
  await clearExistingData();

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, BCRYPT_ROUNDS);
  const tomorrow = getTomorrow();

  console.log("Creating users...");
  await prisma.user.createMany({
    data: [
      {
        email: "admin@ugclinic-fyp.edu.gh",
        passwordHash,
        firstName: "System",
        lastName: "Administrator",
        role: UserRole.ADMIN,
        emailVerified: true,
      },
      {
        email: "doctor@ugclinic-fyp.edu.gh",
        passwordHash,
        firstName: "Kwame",
        lastName: "Mensah",
        phone: "+233201234567",
        role: UserRole.DOCTOR,
        emailVerified: true,
      },
      {
        email: "receptionist@ugclinic-fyp.edu.gh",
        passwordHash,
        firstName: "Ama",
        lastName: "Osei",
        phone: "+233209876543",
        role: UserRole.RECEPTIONIST,
        emailVerified: true,
      },
      {
        studentId: "20240001",
        email: "student@st.ug.edu.gh",
        passwordHash,
        firstName: "Kofi",
        lastName: "Asante",
        phone: "+233244123456",
        role: UserRole.STUDENT,
        emailVerified: true,
      },
    ],
  });

  console.log("Creating services...");
  const services = await prisma.$transaction([
    prisma.service.create({
      data: {
        name: "General Consultation",
        description: "Routine medical consultation with a clinic physician",
        duration: 30,
        category: "General Medicine",
      },
    }),
    prisma.service.create({
      data: {
        name: "Dental Checkup",
        description: "Comprehensive dental examination and oral health assessment",
        duration: 45,
        category: "Dental",
      },
    }),
    prisma.service.create({
      data: {
        name: "Eye Examination",
        description: "Vision screening and basic eye health evaluation",
        duration: 30,
        category: "Ophthalmology",
      },
    }),
  ]);

  console.log("Creating time slots for tomorrow...");
  const timeSlotData = services.flatMap((service) =>
    generateTimeSlots(service.id, tomorrow, service.duration)
  );

  await prisma.timeSlot.createMany({ data: timeSlotData });

  console.log("Database seeded successfully.");
  console.log(`Default password for all users: ${DEFAULT_PASSWORD}`);
  console.log(`Time slots created for: ${tomorrow.toDateString()}`);
}
