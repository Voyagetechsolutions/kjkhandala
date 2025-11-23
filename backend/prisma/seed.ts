import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

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

  // Create Sample Routes
  const route1 = await prisma.route.create({
    data: {
      name: 'Johannesburg - Pretoria',
      origin: 'Johannesburg',
      destination: 'Pretoria',
      distance: 56,
      duration: 60,
      stops: {
        create: [
          { name: 'Johannesburg CBD', order: 1, latitude: -26.2041, longitude: 28.0473 },
          { name: 'Midrand', order: 2, latitude: -25.9894, longitude: 28.1287 },
          { name: 'Centurion', order: 3, latitude: -25.8601, longitude: 28.1894 },
          { name: 'Pretoria CBD', order: 4, latitude: -25.7479, longitude: 28.2293 },
        ],
      },
    },
  });

  const route2 = await prisma.route.create({
    data: {
      name: 'Johannesburg - Durban',
      origin: 'Johannesburg',
      destination: 'Durban',
      distance: 568,
      duration: 360,
      stops: {
        create: [
          { name: 'Johannesburg', order: 1 },
          { name: 'Harrismith', order: 2 },
          { name: 'Ladysmith', order: 3 },
          { name: 'Pietermaritzburg', order: 4 },
          { name: 'Durban', order: 5 },
        ],
      },
    },
  });

  console.log('✅ Routes created:', route1.name, route2.name);

  // Create Sample Buses
  const buses = await prisma.bus.createMany({
    data: [
      {
        registrationNumber: 'KJ-001-GP',
        model: 'Scania Touring',
        capacity: 50,
        status: 'ACTIVE',
        yearOfManufacture: 2020,
        mileage: 45000,
      },
      {
        registrationNumber: 'KJ-002-GP',
        model: 'Mercedes-Benz Tourismo',
        capacity: 45,
        status: 'ACTIVE',
        yearOfManufacture: 2021,
        mileage: 32000,
      },
      {
        registrationNumber: 'KJ-003-GP',
        model: 'Volvo 9700',
        capacity: 48,
        status: 'MAINTENANCE',
        yearOfManufacture: 2019,
        mileage: 78000,
      },
    ],
  });

  console.log('✅ Buses created:', buses.count);

  // Create Sample Drivers
  const drivers = await prisma.driver.createMany({
    data: [
      {
        firstName: 'John',
        lastName: 'Doe',
        licenseNumber: 'DL123456',
        phone: '+27821234567',
        email: 'john.doe@kjkhandala.com',
        status: 'ACTIVE',
        hireDate: new Date('2020-01-15'),
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        licenseNumber: 'DL789012',
        phone: '+27821234568',
        email: 'jane.smith@kjkhandala.com',
        status: 'ACTIVE',
        hireDate: new Date('2021-03-20'),
      },
    ],
  });

  console.log('✅ Drivers created:', drivers.count);

  // Create Sample Employees
  const employees = await prisma.employee.createMany({
    data: [
      {
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'alice.johnson@kjkhandala.com',
        phone: '+27821234569',
        position: 'Ticketing Officer',
        department: 'Operations',
        hireDate: new Date('2019-06-01'),
        salary: 15000,
        status: 'ACTIVE',
      },
      {
        firstName: 'Bob',
        lastName: 'Williams',
        email: 'bob.williams@kjkhandala.com',
        phone: '+27821234570',
        position: 'Mechanic',
        department: 'Maintenance',
        hireDate: new Date('2020-02-15'),
        salary: 18000,
        status: 'ACTIVE',
      },
      {
        firstName: 'Carol',
        lastName: 'Brown',
        email: 'carol.brown@kjkhandala.com',
        phone: '+27821234571',
        position: 'Accountant',
        department: 'Finance',
        hireDate: new Date('2021-01-10'),
        salary: 22000,
        status: 'ACTIVE',
      },
    ],
  });

  console.log('✅ Employees created:', employees.count);

  // Create Sample Inventory Items
  const inventory = await prisma.inventoryItem.createMany({
    data: [
      {
        name: 'Engine Oil 5W-30',
        category: 'oil',
        quantity: 50,
        unitPrice: 250,
        reorderLevel: 20,
        supplier: 'AutoParts SA',
        location: 'Warehouse A',
      },
      {
        name: 'Brake Pads',
        category: 'parts',
        quantity: 30,
        unitPrice: 450,
        reorderLevel: 10,
        supplier: 'BrakeMaster',
        location: 'Warehouse A',
      },
      {
        name: 'Air Filters',
        category: 'filters',
        quantity: 40,
        unitPrice: 180,
        reorderLevel: 15,
        supplier: 'FilterPro',
        location: 'Warehouse B',
      },
      {
        name: 'Tires 295/80R22.5',
        category: 'tires',
        quantity: 12,
        unitPrice: 3500,
        reorderLevel: 8,
        supplier: 'TireWorld',
        location: 'Warehouse C',
      },
    ],
  });

  console.log('✅ Inventory items created:', inventory.count);

  // Create Sample Accounts
  const accounts = await prisma.account.createMany({
    data: [
      {
        name: 'Main Operating Account',
        accountNumber: 'ACC-001',
        bankName: 'First National Bank',
        balance: 500000,
        type: 'checking',
        isActive: true,
      },
      {
        name: 'Payroll Account',
        accountNumber: 'ACC-002',
        bankName: 'Standard Bank',
        balance: 250000,
        type: 'checking',
        isActive: true,
      },
      {
        name: 'Petty Cash',
        accountNumber: 'CASH-001',
        bankName: 'N/A',
        balance: 10000,
        type: 'petty_cash',
        isActive: true,
      },
    ],
  });

  console.log('✅ Accounts created:', accounts.count);

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
