#!/usr/bin/env node

/**
 * Run Maintenance Dashboard Seed Script
 * Seeds all maintenance-related data into the database
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Starting Maintenance Dashboard Seeding Process...\n');

try {
  // Run the seed script
  console.log('📦 Running Prisma maintenance seed...');
  execSync('node prisma/seed-maintenance.js', {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit'
  });

  console.log('\n✅ Maintenance dashboard seeding completed successfully!');
  console.log('\n📊 You can now access the maintenance dashboard with real data.');
  process.exit(0);
} catch (error) {
  console.error('\n❌ Seeding failed:', error.message);
  process.exit(1);
}
