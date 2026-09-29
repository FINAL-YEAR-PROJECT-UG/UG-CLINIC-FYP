import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { hashPassword } from '../src/utils/password';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

interface StaffInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'RECEPTIONIST' | 'DOCTOR' | 'ADMIN';
}

async function createStaffAccount(staffData: StaffInput) {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: staffData.email },
    });

    if (existingUser) {
      console.log(`❌ User with email ${staffData.email} already exists`);
      return false;
    }

    // Validate role
    if (!['RECEPTIONIST', 'DOCTOR', 'ADMIN'].includes(staffData.role)) {
      console.log(`❌ Invalid role: ${staffData.role}. Must be RECEPTIONIST, DOCTOR, or ADMIN`);
      return false;
    }

    // Hash password
    const passwordHash = await hashPassword(staffData.password);

    // Create staff user
    const user = await prisma.user.create({
      data: {
        email: staffData.email,
        passwordHash,
        firstName: staffData.firstName,
        lastName: staffData.lastName,
        phone: staffData.phone,
        role: staffData.role,
        twoFactorEnabled: true,
        phoneVerified: true, // Auto-verify for initial setup
        maxSessions: 3,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        isActive: true,
        twoFactorEnabled: true,
        createdAt: true,
      },
    });

    console.log(`✅ Staff account created successfully:`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Phone: ${user.phone}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Active: ${user.isActive}`);
    console.log(`   2FA Enabled: ${user.twoFactorEnabled ? 'Yes' : 'No'}`);
    
    return true;
  } catch (error) {
    console.error(`❌ Error creating staff account:`, error);
    return false;
  }
}

async function listStaffAccounts() {
  try {
    const staffUsers = await prisma.user.findMany({
      where: {
        role: {
          in: ['RECEPTIONIST', 'DOCTOR', 'ADMIN'],
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        isActive: true,
        twoFactorEnabled: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`\n📋 Current Staff Accounts (${staffUsers.length}):`);
    console.log('─'.repeat(80));
    
    if (staffUsers.length === 0) {
      console.log('No staff accounts found.');
      return;
    }

    staffUsers.forEach((staff, index) => {
      console.log(`${index + 1}. ${staff.firstName} ${staff.lastName} (${staff.role})`);
      console.log(`   Email: ${staff.email}`);
      console.log(`   Phone: ${staff.phone}`);
      console.log(`   Active: ${staff.isActive ? 'Yes' : 'No'}`);
      console.log(`   2FA: ${staff.twoFactorEnabled ? 'Enabled' : 'Disabled'}`);
      console.log(`   Created: ${staff.createdAt.toLocaleString()}`);
      console.log('─'.repeat(80));
    });
  } catch (error) {
    console.error('❌ Error listing staff accounts:', error);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  console.log('🏥 UG Clinic Staff Management Script');
  console.log('═'.repeat(80));

  switch (command) {
    case 'create':
      if (args.length < 7) {
        console.log('❌ Usage: npm run create-staff create <email> <password> <firstName> <lastName> <phone> <role>');
        console.log('   Roles: RECEPTIONIST, DOCTOR, ADMIN');
        process.exit(1);
      }

      const staffData: StaffInput = {
        email: args[1],
        password: args[2],
        firstName: args[3],
        lastName: args[4],
        phone: args[5],
        role: args[6] as 'RECEPTIONIST' | 'DOCTOR' | 'ADMIN',
      };

      await createStaffAccount(staffData);
      break;

    case 'list':
      await listStaffAccounts();
      break;

    case 'demo':
      console.log('🔧 Creating demo staff accounts...');
      
      // Create demo admin
      await createStaffAccount({
        email: 'admin@clinic.ug.edu.gh',
        password: 'Admin123!@#',
        firstName: 'System',
        lastName: 'Administrator',
        phone: '+233241234567',
        role: 'ADMIN',
      });

      // Create demo doctor
      await createStaffAccount({
        email: 'doctor@clinic.ug.edu.gh',
        password: 'Doctor123!@#',
        firstName: 'Dr.',
        lastName: 'Kwame',
        phone: '+233241234568',
        role: 'DOCTOR',
      });

      // Create demo receptionist
      await createStaffAccount({
        email: 'reception@clinic.ug.edu.gh',
        password: 'Reception123!@#',
        firstName: 'Ama',
        lastName: 'Mensa',
        phone: '+233241234569',
        role: 'RECEPTIONIST',
      });

      console.log('\n✅ Demo staff accounts created successfully!');
      console.log('📝 Demo Credentials:');
      console.log('   Admin: admin@clinic.ug.edu.gh / Admin123!@#');
      console.log('   Doctor: doctor@clinic.ug.edu.gh / Doctor123!@#');
      console.log('   Reception: reception@clinic.ug.edu.gh / Reception123!@#');
      break;

    default:
      console.log('Usage:');
      console.log('  npm run create-staff create <email> <password> <firstName> <lastName> <phone> <role>');
      console.log('  npm run create-staff list');
      console.log('  npm run create-staff demo');
      console.log('');
      console.log('Examples:');
      console.log('  npm run create-staff create doctor@clinic.ug.edu.gh pass123 Dr. Kwame +233241234567 DOCTOR');
      console.log('  npm run create-staff list');
      console.log('  npm run create-staff demo');
      break;
  }

  await prisma.$disconnect();
}

main();