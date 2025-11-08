const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create Super Admin User
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@kjkhandala.com' },
    update: {},
    create: {
      email: 'admin@kjkhandala.com',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      phone: '+27123456789',
      role: 'SUPER_ADMIN',
    },
  });

  console.log('✅ Super Admin created:', superAdmin.email);

  // Create Operations Manager
  const opsManager = await prisma.user.upsert({
    where: { email: 'operations@kjkhandala.com' },
    update: {},
    create: {
      email: 'operations@kjkhandala.com',
      password: hashedPassword,
      firstName: 'Operations',
      lastName: 'Manager',
      phone: '+27123456790',
      role: 'OPERATIONS_MANAGER',
    },
  });

  console.log('✅ Operations Manager created:', opsManager.email);

  // Create Finance Manager
  const financeManager = await prisma.user.upsert({
    where: { email: 'finance@kjkhandala.com' },
    update: {},
    create: {
      email: 'finance@kjkhandala.com',
      password: hashedPassword,
      firstName: 'Finance',
      lastName: 'Manager',
      phone: '+27123456791',
      role: 'FINANCE_MANAGER',
    },
  });

  console.log('✅ Finance Manager created:', financeManager.email);

  // Create HR Manager
  const hrManager = await prisma.user.upsert({
    where: { email: 'hr@kjkhandala.com' },
    update: {},
    create: {
      email: 'hr@kjkhandala.com',
      password: hashedPassword,
      firstName: 'HR',
      lastName: 'Manager',
      phone: '+27123456792',
      role: 'HR_MANAGER',
    },
  });

  console.log('✅ HR Manager created:', hrManager.email);

  // Create Maintenance Manager
  const maintenanceManager = await prisma.user.upsert({
    where: { email: 'maintenance@kjkhandala.com' },
    update: {},
    create: {
      email: 'maintenance@kjkhandala.com',
      password: hashedPassword,
      firstName: 'Maintenance',
      lastName: 'Manager',
      phone: '+27123456793',
      role: 'MAINTENANCE_MANAGER',
    },
  });

  console.log('✅ Maintenance Manager created:', maintenanceManager.email);

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📝 Default Login Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Super Admin:');
  console.log('  Email: admin@kjkhandala.com');
  console.log('  Password: admin123');
  console.log('\nOperations Manager:');
  console.log('  Email: operations@kjkhandala.com');
  console.log('  Password: admin123');
  console.log('\nFinance Manager:');
  console.log('  Email: finance@kjkhandala.com');
  console.log('  Password: admin123');
  console.log('\nHR Manager:');
  console.log('  Email: hr@kjkhandala.com');
  console.log('  Password: admin123');
  console.log('\nMaintenance Manager:');
  console.log('  Email: maintenance@kjkhandala.com');
  console.log('  Password: admin123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
