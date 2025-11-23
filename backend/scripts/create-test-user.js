const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: 'admin@kjkhandala.com' }
    });

    if (existing) {
      console.log('✅ Test user already exists:');
      console.log('Email: admin@kjkhandala.com');
      console.log('Password: Admin@123');
      console.log('Role:', existing.role);
      return;
    }

    // Create test user
    const hashedPassword = await bcrypt.hash('Admin@123', 10);
    
    const user = await prisma.user.create({
      data: {
        email: 'admin@kjkhandala.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        phone: '+26771234567',
        role: 'SUPER_ADMIN'
      }
    });

    console.log('✅ Test user created successfully!');
    console.log('');
    console.log('Login Credentials:');
    console.log('==================');
    console.log('Email: admin@kjkhandala.com');
    console.log('Password: Admin@123');
    console.log('Role:', user.role);
    console.log('');
    console.log('You can now login at: http://localhost:8080/auth');
    
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
