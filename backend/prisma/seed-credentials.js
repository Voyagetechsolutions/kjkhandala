const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedCredentials() {
  console.log('🔐 Seeding User Credentials...\n');

  try {
    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 10);

    // 1. Ticketing Agent
    const ticketingAgent = await prisma.user.upsert({
      where: { email: 'ticketing@voyage.com' },
      update: {
        password: hashedPassword,
        firstName: 'Sarah',
        lastName: 'Ticketing',
        phone: '+267 72 345 678',
        role: 'TICKETING_AGENT'
      },
      create: {
        email: 'ticketing@voyage.com',
        password: hashedPassword,
        firstName: 'Sarah',
        lastName: 'Ticketing',
        phone: '+267 72 345 678',
        role: 'TICKETING_AGENT'
      }
    });
    console.log('✅ Ticketing Agent:', ticketingAgent.email);

    // 2. Driver User
    const driverUser = await prisma.user.upsert({
      where: { email: 'driver@voyage.com' },
      update: {
        password: hashedPassword,
        firstName: 'John',
        lastName: 'Driver',
        phone: '+267 73 456 789',
        role: 'DRIVER'
      },
      create: {
        email: 'driver@voyage.com',
        password: hashedPassword,
        firstName: 'John',
        lastName: 'Driver',
        phone: '+267 73 456 789',
        role: 'DRIVER'
      }
    });
    console.log('✅ Driver User:', driverUser.email);

    // 3. Driver Profile (optional - only if needed for operations)
    try {
      const driverProfile = await prisma.driver.upsert({
        where: { licenseNumber: 'DL-2024-001' },
        update: {
          firstName: 'John',
          lastName: 'Driver',
          phone: '+267 73 456 789',
          email: 'driver@voyage.com',
          status: 'ACTIVE',
        },
        create: {
          firstName: 'John',
          lastName: 'Driver',
          licenseNumber: 'DL-2024-001',
          licenseExpiry: new Date('2026-12-31'),
          phone: '+267 73 456 789',
          email: 'driver@voyage.com',
          status: 'ACTIVE',
          hireDate: new Date(),
        }
      });
      console.log('✅ Driver Profile:', driverProfile.licenseNumber);
    } catch (error) {
      console.log('⚠️  Driver Profile skipped (optional)');
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ CREDENTIALS SAVED TO DATABASE!');
    console.log('='.repeat(70));

    console.log('\n📋 LOGIN CREDENTIALS:\n');
    
    console.log('1️⃣  TICKETING AGENT');
    console.log('   Email:    ticketing@voyage.com');
    console.log('   Password: password123');
    console.log('   Role:     TICKETING_AGENT');
    console.log('   Name:     Sarah Ticketing');
    console.log('   Phone:    +267 72 345 678\n');

    console.log('2️⃣  DRIVER');
    console.log('   Email:    driver@voyage.com');
    console.log('   Password: password123');
    console.log('   Role:     DRIVER');
    console.log('   Name:     John Driver');
    console.log('   Phone:    +267 73 456 789');
    console.log('   License:  DL-2024-001');
    console.log('   Expiry:   2026-12-31\n');

    console.log('='.repeat(70));
    console.log('💡 You can now login with these credentials at:');
    console.log('   http://localhost:8080/auth');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('❌ Error seeding credentials:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedCredentials()
  .then(() => {
    console.log('\n✅ Seed completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  });
