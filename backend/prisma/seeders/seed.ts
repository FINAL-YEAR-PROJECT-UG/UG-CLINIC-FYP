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
  await prisma.securityEvent.deleteMany();
  await prisma.failedLoginAttempt.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.oTPCode.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.backupRecoveryCode.deleteMany();
  await prisma.securityQuestion.deleteMany();
  await prisma.session.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.newsPost.deleteMany();
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
        email: "eoteng-kumi@st.ug.edu.gh",
        passwordHash,
        firstName: "System",
        lastName: "Administrator",
        phone: "+233595591157",
        role: UserRole.ADMIN,
        emailVerified: true,
        phoneVerified: true,
        twoFactorEnabled: true,
        maxSessions: 5,
      },
      {
        email: "receptionist@st.ug.edu.gh",
        passwordHash,
        firstName: "Main Clinic",
        lastName: "Receptionist",
        phone: "+233201234567",
        role: UserRole.RECEPTIONIST,
        emailVerified: true,
        phoneVerified: true,
        twoFactorEnabled: false,
        maxSessions: 5,
      },
      {
        email: "dr.gabriel@st.ug.edu.gh",
        passwordHash,
        firstName: "Gabriel",
        lastName: "Mensah",
        phone: "+23350146635",
        role: UserRole.DOCTOR,
        emailVerified: true,
        phoneVerified: true,
        twoFactorEnabled: false,
        maxSessions: 5,
      },
      {
        email: "dr.sarah@st.ug.edu.gh",
        passwordHash,
        firstName: "Sarah",
        lastName: "Quaye",
        phone: "+233244987654",
        role: UserRole.DOCTOR,
        emailVerified: true,
        phoneVerified: true,
        twoFactorEnabled: false,
        maxSessions: 5,
      },
      {
        email: "dr.emmanuel@st.ug.edu.gh",
        passwordHash,
        firstName: "Emmanuel",
        lastName: "Osei",
        phone: "+233208765432",
        role: UserRole.DOCTOR,
        emailVerified: true,
        phoneVerified: true,
        twoFactorEnabled: false,
        maxSessions: 5,
      },
      {
        email: "dr.abena@st.ug.edu.gh",
        passwordHash,
        firstName: "Abena",
        lastName: "Boateng",
        phone: "+233551239876",
        role: UserRole.DOCTOR,
        emailVerified: true,
        phoneVerified: true,
        twoFactorEnabled: false,
        maxSessions: 5,
      },
      {
        email: "dr.kwame@st.ug.edu.gh",
        passwordHash,
        firstName: "Kwame",
        lastName: "Adom",
        phone: "+233277654321",
        role: UserRole.DOCTOR,
        emailVerified: true,
        phoneVerified: true,
        twoFactorEnabled: false,
        maxSessions: 5,
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

  console.log("");
  console.log("NOTE: Admin, Receptionist, Student, and 5 Doctors seeded successfully.");
  console.log("Only Admin and Receptionist credentials are authorized to log into the Admin/Receptionist portal.");

  console.log("Creating services...");
  const services = await prisma.$transaction([
    prisma.service.create({
      data: {
        name: "General Consultation",
        description: "Routine medical checkups, physical symptoms, and general health advice.",
        duration: 20,
        category: "General Medicine",
      },
    }),
    prisma.service.create({
      data: {
        name: "Mental Health & Counseling",
        description: "Confidential psychological support, stress management, and guidance.",
        duration: 45,
        category: "Mental Health",
      },
    }),
    prisma.service.create({
      data: {
        name: "Eye Care Services",
        description: "Vision screening, eye health assessments, and specialized eye treatment.",
        duration: 30,
        category: "Ophthalmology",
      },
    }),
    prisma.service.create({
      data: {
        name: "Dental Checkup & Oral Health",
        description: "Oral health examination, teeth cleaning, and dental hygiene advice.",
        duration: 30,
        category: "Dental",
      },
    }),
    prisma.service.create({
      data: {
        name: "HIV/AIDS Testing & Support",
        description: "Voluntary testing, pre/post counselling, and confidential care.",
        duration: 30,
        category: "Screening",
      },
    }),
    prisma.service.create({
      data: {
        name: "Nutrition & Dietetics",
        description: "Personalized meal planning, BMI consultations, and healthy lifestyle guidance.",
        duration: 30,
        category: "Nutrition",
      },
    }),
    prisma.service.create({
      data: {
        name: "Comprehensive Health Screening",
        description: "Blood pressure, glucose tests, lab work, and physical evaluation.",
        duration: 40,
        category: "Screening",
      },
    }),
    prisma.service.create({
      data: {
        name: "Vaccinations & Immunizations",
        description: "Travel vaccines, seasonal flu shots, and booster immunizations.",
        duration: 15,
        category: "Preventative",
      },
    }),
    prisma.service.create({
      data: {
        name: "Family Planning & Reproductive Health",
        description: "Confidential family planning advice, contraception services, and reproductive health.",
        duration: 30,
        category: "Preventative",
      },
    }),
    prisma.service.create({
      data: {
        name: "Prescription & Pharmacy Refill",
        description: "Medication refills and pharmacist consultation for students.",
        duration: 15,
        category: "Pharmacy",
      },
    }),
  ]);

  console.log("Creating time slots for tomorrow...");
  const timeSlotData = services.flatMap((service) =>
    generateTimeSlots(service.id, tomorrow, service.duration)
  );

  await prisma.timeSlot.createMany({ data: timeSlotData });

  // Sample appointments removed - no default appointments should be created
  // Users will only see appointments they book themselves

  console.log("Database seeded successfully.");
  console.log(`Default password for all users: ${DEFAULT_PASSWORD}`);
  console.log(`Time slots created for: ${tomorrow.toDateString()}`);
  console.log("");
  console.log("Staff MFA: enabled for admin@ugclinic-fyp.edu.gh");
  console.log("  - With SMTP/Twilio: code is sent by email or SMS");
  console.log("  - Local dev (no providers): check backend console for [2FA] log line");
}
