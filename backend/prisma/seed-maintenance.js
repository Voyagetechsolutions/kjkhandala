const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedMaintenance() {
  console.log('🌱 Seeding maintenance data...');

  try {
    // Get all buses
    const buses = await prisma.bus.findMany();
    if (buses.length === 0) {
      console.log('⚠️  No buses found. Please seed buses first.');
      return;
    }

    // Get admin/maintenance users
    const users = await prisma.user.findMany({
      where: {
        role: {
          in: ['SUPER_ADMIN', 'MAINTENANCE_MANAGER'],
        },
      },
    });

    if (users.length === 0) {
      console.log('⚠️  No admin users found. Using first user.');
      const firstUser = await prisma.user.findFirst();
      users.push(firstUser);
    }

    // Seed Maintenance Schedules
    console.log('📅 Creating maintenance schedules...');
    const scheduleTypes = ['Oil Change', 'Brake Inspection', 'Tire Rotation', 'Full Service', 'Engine Service'];
    const schedulePromises = buses.slice(0, 10).map((bus, index) => {
      const type = scheduleTypes[index % scheduleTypes.length];
      const daysAhead = [5, 10, 15, 20, 30][index % 5];
      
      return prisma.maintenanceSchedule.create({
        data: {
          busId: bus.id,
          serviceType: type,
          intervalKm: type === 'Oil Change' ? 5000 : type === 'Full Service' ? 20000 : 10000,
          nextServiceDate: new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000),
          status: daysAhead > 7 ? 'scheduled' : 'scheduled',
        },
      });
    });
    await Promise.all(schedulePromises);
    console.log(`✅ Created ${schedulePromises.length} maintenance schedules`);

    // Seed Inventory Items
    console.log('📦 Creating inventory items...');
    const inventoryItems = [
      { name: 'Engine Oil 5W-30', category: 'Oil', quantity: 50, unitPrice: 450, reorderLevel: 20, supplier: 'Total Botswana', location: 'Warehouse A' },
      { name: 'Brake Pads - Front', category: 'Brakes', quantity: 25, unitPrice: 850, reorderLevel: 10, supplier: 'AutoZone', location: 'Warehouse B' },
      { name: 'Air Filter', category: 'Filters', quantity: 30, unitPrice: 250, reorderLevel: 15, supplier: 'NAPA Auto Parts', location: 'Warehouse A' },
      { name: 'Tire - 295/80R22.5', category: 'Tires', quantity: 12, unitPrice: 3500, reorderLevel: 8, supplier: 'Bridgestone', location: 'Tire Storage' },
      { name: 'Coolant Fluid', category: 'Fluids', quantity: 40, unitPrice: 180, reorderLevel: 15, supplier: 'Engen', location: 'Warehouse A' },
      { name: 'Wiper Blades', category: 'Accessories', quantity: 60, unitPrice: 120, reorderLevel: 20, supplier: 'Bosch', location: 'Warehouse C' },
      { name: 'Battery 12V', category: 'Electrical', quantity: 8, unitPrice: 1800, reorderLevel: 5, supplier: 'AC Delco', location: 'Warehouse B' },
      { name: 'Fuel Filter', category: 'Filters', quantity: 35, unitPrice: 320, reorderLevel: 15, supplier: 'Mann Filter', location: 'Warehouse A' },
      { name: 'Transmission Fluid', category: 'Fluids', quantity: 18, unitPrice: 450, reorderLevel: 10, supplier: 'Castrol', location: 'Warehouse A' },
      { name: 'Headlight Bulb H7', category: 'Electrical', quantity: 45, unitPrice: 95, reorderLevel: 20, supplier: 'Philips', location: 'Warehouse C' },
      { name: 'Spark Plugs', category: 'Engine', quantity: 100, unitPrice: 85, reorderLevel: 30, supplier: 'NGK', location: 'Warehouse B' },
      { name: 'Cabin Air Filter', category: 'Filters', quantity: 22, unitPrice: 180, reorderLevel: 15, supplier: 'Fram', location: 'Warehouse A' },
    ];

    const inventoryPromises = inventoryItems.map(item =>
      prisma.inventoryItem.create({ data: item })
    );
    await Promise.all(inventoryPromises);
    console.log(`✅ Created ${inventoryItems.length} inventory items`);

    // Seed Inspections
    console.log('🔍 Creating inspections...');
    const inspectionPromises = buses.slice(0, 8).map((bus, index) => {
      const daysAgo = Math.floor(Math.random() * 30);
      const statuses = ['PASSED', 'PASSED', 'PASSED', 'NEEDS_ATTENTION', 'FAILED'];
      
      return prisma.inspection.create({
        data: {
          busId: bus.id,
          date: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
          inspectorId: users[index % users.length].id,
          status: statuses[index % statuses.length],
          checklist: {
            brakes: index % 5 === 4 ? 'needs_attention' : 'good',
            tires: 'good',
            lights: 'good',
            engine: index % 5 === 3 ? 'needs_attention' : 'good',
            bodywork: 'good',
            interior: 'good',
          },
          issues: index % 5 !== 0 ? 'Minor wear on brake pads' : null,
          notes: 'Routine inspection completed',
        },
      });
    });
    await Promise.all(inspectionPromises);
    console.log(`✅ Created ${inspectionPromises.length} inspections`);

    // Seed Repairs
    console.log('🔧 Creating repairs...');
    const repairPromises = buses.slice(0, 6).map((bus, index) => {
      const daysAgo = 5 + Math.floor(Math.random() * 60);
      const descriptions = [
        'Brake system maintenance and replacement',
        'Engine oil change and filter replacement',
        'Tire rotation and alignment',
        'Air conditioning system repair',
        'Transmission fluid change',
        'Battery replacement and electrical system check',
      ];
      
      return prisma.repair.create({
        data: {
          busId: bus.id,
          date: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
          description: descriptions[index % descriptions.length],
          partsCost: 800 + Math.random() * 2000,
          laborCost: 500 + Math.random() * 1500,
          mechanicId: users[index % users.length].id,
          status: 'completed',
          notes: 'Work completed successfully. All parts replaced with OEM standards.',
        },
      });
    });
    await Promise.all(repairPromises);
    console.log(`✅ Created ${repairPromises.length} repairs`);

    // Seed Maintenance Costs
    console.log('💰 Creating maintenance costs...');
    const costPromises = [];
    buses.slice(0, 10).forEach((bus, busIndex) => {
      // Create 3-5 cost entries per bus
      const numCosts = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < numCosts; i++) {
        const daysAgo = Math.floor(Math.random() * 90);
        const categories = ['parts', 'labor', 'external_service'];
        const category = categories[Math.floor(Math.random() * categories.length)];
        
        costPromises.push(
          prisma.maintenanceCost.create({
            data: {
              busId: bus.id,
              date: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
              category,
              amount: category === 'parts' ? 500 + Math.random() * 3000 : 300 + Math.random() * 2000,
              description: `${category.charAt(0).toUpperCase() + category.slice(1)} cost for maintenance`,
            },
          })
        );
      }
    });
    await Promise.all(costPromises);
    console.log(`✅ Created ${costPromises.length} maintenance cost records`);

    // Seed Work Orders
    console.log('📋 Creating work orders...');
    const workOrderPromises = buses.slice(0, 12).map((bus, index) => {
      const statuses = ['pending', 'in_progress', 'completed', 'completed'];
      const priorities = ['low', 'medium', 'high', 'critical'];
      const status = statuses[index % statuses.length];
      
      return prisma.workOrder.create({
        data: {
          busId: bus.id,
          title: `${['Scheduled', 'Urgent', 'Routine', 'Emergency'][index % 4]} Maintenance`,
          description: `${['Oil change', 'Brake inspection', 'Tire replacement', 'Engine service'][index % 4]} required`,
          priority: priorities[index % priorities.length],
          status,
          assignedToId: status !== 'pending' ? users[index % users.length].id : null,
          scheduledDate: new Date(Date.now() + (index - 6) * 2 * 24 * 60 * 60 * 1000),
          completedDate: status === 'completed' ? new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000) : null,
          estimatedHours: 2 + Math.random() * 6,
          actualHours: status === 'completed' ? 2 + Math.random() * 6 : null,
          cost: status === 'completed' ? 1000 + Math.random() * 3000 : 0,
          createdById: users[0].id,
        },
      });
    });
    await Promise.all(workOrderPromises);
    console.log(`✅ Created ${workOrderPromises.length} work orders`);

    // Seed Maintenance Records
    console.log('📝 Creating maintenance records...');
    const recordPromises = buses.slice(0, 8).map((bus, index) => {
      const types = ['preventive', 'corrective', 'inspection'];
      const daysAgo = Math.floor(Math.random() * 60);
      
      return prisma.maintenanceRecord.create({
        data: {
          busId: bus.id,
          date: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
          type: types[index % types.length],
          description: `${types[index % types.length].charAt(0).toUpperCase() + types[index % types.length].slice(1)} maintenance performed`,
          cost: 800 + Math.random() * 2500,
          mileage: 150000 + Math.floor(Math.random() * 100000),
          technician: `Mechanic ${String.fromCharCode(65 + (index % 5))}`,
          notes: 'All systems checked and functioning properly',
        },
      });
    });
    await Promise.all(recordPromises);
    console.log(`✅ Created ${recordPromises.length} maintenance records`);

    console.log('✅ Maintenance data seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding maintenance data:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedMaintenance()
    .then(() => {
      console.log('✅ Done!');
      prisma.$disconnect();
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      prisma.$disconnect();
      process.exit(1);
    });
}

module.exports = { seedMaintenance };
