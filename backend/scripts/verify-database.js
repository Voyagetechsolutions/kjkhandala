#!/usr/bin/env node

/**
 * Verify Database Connection and Maintenance Tables
 * Checks if all required tables exist and have data
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkTable(modelName, displayName) {
  try {
    const count = await prisma[modelName].count();
    if (count > 0) {
      log(`✅ ${displayName}: ${count} records`, 'green');
      return { success: true, count };
    } else {
      log(`⚠️  ${displayName}: Empty (no records)`, 'yellow');
      return { success: true, count: 0 };
    }
  } catch (error) {
    log(`❌ ${displayName}: Error - ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function verifyDatabase() {
  log('\n🔍 Verifying Database Connection and Tables...', 'blue');
  log('='.repeat(60), 'cyan');

  try {
    // Test database connection
    log('\n📡 Testing database connection...', 'blue');
    await prisma.$connect();
    log('✅ Database connection successful', 'green');

    // Check all maintenance tables
    log('\n📋 Checking Maintenance Tables:', 'blue');
    
    const tables = [
      { model: 'workOrder', name: 'Work Orders' },
      { model: 'maintenanceSchedule', name: 'Maintenance Schedules' },
      { model: 'inspection', name: 'Inspections' },
      { model: 'repair', name: 'Repairs' },
      { model: 'inventoryItem', name: 'Inventory Items' },
      { model: 'stockMovement', name: 'Stock Movements' },
      { model: 'maintenanceRecord', name: 'Maintenance Records' },
      { model: 'maintenanceCost', name: 'Maintenance Costs' },
    ];

    let totalRecords = 0;
    let emptyTables = 0;
    let errors = 0;

    for (const table of tables) {
      const result = await checkTable(table.model, table.name);
      if (result.success) {
        totalRecords += result.count;
        if (result.count === 0) emptyTables++;
      } else {
        errors++;
      }
    }

    // Check related tables
    log('\n🔗 Checking Related Tables:', 'blue');
    const relatedTables = [
      { model: 'bus', name: 'Buses' },
      { model: 'user', name: 'Users' },
    ];

    for (const table of relatedTables) {
      await checkTable(table.model, table.name);
    }

    // Summary
    log('\n' + '='.repeat(60), 'cyan');
    log('📊 Verification Summary:', 'blue');
    log(`   Total Records: ${totalRecords}`, 'cyan');
    log(`   Empty Tables: ${emptyTables}`, emptyTables > 0 ? 'yellow' : 'green');
    log(`   Errors: ${errors}`, errors > 0 ? 'red' : 'green');
    log('='.repeat(60), 'cyan');

    if (errors > 0) {
      log('\n❌ Some tables have errors. Check your database schema.', 'red');
      log('   Run: npx prisma migrate dev', 'yellow');
    } else if (emptyTables === tables.length) {
      log('\n⚠️  All maintenance tables are empty.', 'yellow');
      log('   Run: node prisma/seed-maintenance.js', 'cyan');
    } else if (emptyTables > 0) {
      log('\n⚠️  Some tables are empty. Consider seeding data.', 'yellow');
      log('   Run: node prisma/seed-maintenance.js', 'cyan');
    } else {
      log('\n✅ Database is properly set up with data!', 'green');
    }

    // Additional checks
    log('\n🔍 Additional Checks:', 'blue');
    
    // Check for low stock items
    const lowStockItems = await prisma.inventoryItem.findMany({
      where: {
        quantity: {
          lte: prisma.inventoryItem.fields.reorderLevel
        }
      }
    }).catch(() => []);
    
    if (lowStockItems && lowStockItems.length > 0) {
      log(`⚠️  ${lowStockItems.length} items are low on stock`, 'yellow');
    } else {
      log(`✅ Inventory levels are adequate`, 'green');
    }

    // Check for overdue schedules
    const overdueSchedules = await prisma.maintenanceSchedule.count({
      where: {
        nextServiceDate: {
          lt: new Date()
        },
        status: {
          not: 'completed'
        }
      }
    }).catch(() => 0);

    if (overdueSchedules > 0) {
      log(`⚠️  ${overdueSchedules} maintenance schedules are overdue`, 'yellow');
    } else {
      log(`✅ All schedules are up to date`, 'green');
    }

    // Check for pending work orders
    const pendingWorkOrders = await prisma.workOrder.count({
      where: {
        status: 'pending'
      }
    }).catch(() => 0);

    if (pendingWorkOrders > 0) {
      log(`📋 ${pendingWorkOrders} work orders are pending`, 'cyan');
    }

  } catch (error) {
    log(`\n❌ Fatal Error: ${error.message}`, 'red');
    log('   Check your database connection settings in .env', 'yellow');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }

  log('\n✅ Verification complete!\n', 'green');
}

// Run verification
verifyDatabase().catch((error) => {
  log(`\n❌ Verification failed: ${error.message}`, 'red');
  process.exit(1);
});
