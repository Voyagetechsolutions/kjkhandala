const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createUsers() {
  try {
    console.log('🚀 Creating Ticketing Agent and Driver users...\n');

    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 10);

    // 1. Create Ticketing Agent
    console.log('📝 Creating Ticketing Agent...');
    const ticketingAgent = await prisma.user.upsert({
      where: { email: 'ticketing@voyage.com' },
      update: {},
      create: {
        email: 'ticketing@voyage.com',
        password: hashedPassword,
        firstName: 'Sarah',
        lastName: 'Ticketing',
        phone: '+267 72 345 678',
        role: 'TICKETING_AGENT'
      }
    });
    console.log('✅ Ticketing Agent created:', ticketingAgent.email);

    // 2. Create Driver
    console.log('\n📝 Creating Driver...');
    const driver = await prisma.user.upsert({
      where: { email: 'driver@voyage.com' },
      update: {},
      create: {
        email: 'driver@voyage.com',
        password: hashedPassword,
        firstName: 'John',
        lastName: 'Driver',
        phone: '+267 73 456 789',
        role: 'DRIVER'
      }
    });
    console.log('✅ Driver created:', driver.email);

    // Create driver profile
    console.log('\n📝 Creating Driver Profile...');
    const driverProfile = await prisma.driver.upsert({
      where: { licenseNumber: 'DL-2024-001' },
      update: {},
      create: {
        firstName: driver.firstName,
        lastName: driver.lastName,
        name: `${driver.firstName} ${driver.lastName}`,
        phone: driver.phone,
        email: driver.email,
        licenseNumber: 'DL-2024-001',
        licenseExpiry: new Date('2026-12-31'),
        status: 'ACTIVE',
        hireDate: new Date(),
      }
    });
    console.log('✅ Driver profile created');

    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL USERS CREATED SUCCESSFULLY!');
    console.log('='.repeat(60));

    console.log('\n📋 LOGIN CREDENTIALS:\n');
    
    console.log('1️⃣  TICKETING AGENT');
    console.log('   Email:    ticketing@voyage.com');
    console.log('   Password: password123');
    console.log('   Role:     TICKETING_AGENT');
    console.log('   Access:   Ticketing Module\n');

    console.log('2️⃣  DRIVER');
    console.log('   Email:    driver@voyage.com');
    console.log('   Password: password123');
    console.log('   Role:     DRIVER');
    console.log('   Access:   Driver App/Portal');
    console.log('   License:  DL-2024-001\n');

    console.log('='.repeat(60));
    console.log('💡 TIP: You can now login with these credentials!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error creating users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createUsers()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
