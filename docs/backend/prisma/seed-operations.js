const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Operations data...');

  try {
    // Create Operations Manager user if not exists
    const hashedPassword = await bcrypt.hash('operations123', 10);
    const operationsManager = await prisma.user.upsert({
      where: { email: 'operations@kjkhandala.com' },
      update: {},
      create: {
        email: 'operations@kjkhandala.com',
        password: hashedPassword,
        firstName: 'Operations',
        lastName: 'Manager',
        phone: '+267 72 123 456',
        role: 'OPERATIONS_MANAGER',
      },
    });
    console.log('✅ Operations Manager user created');

    // Create Routes
    const routes = [];
    const routeData = [
      { name: 'Gaborone-Francistown', origin: 'Gaborone', destination: 'Francistown', distance: 440, duration: 360 },
      { name: 'Gaborone-Maun', origin: 'Gaborone', destination: 'Maun', distance: 940, duration: 720 },
      { name: 'Francistown-Kasane', origin: 'Francistown', destination: 'Kasane', distance: 530, duration: 420 },
      { name: 'Gaborone-Palapye', origin: 'Gaborone', destination: 'Palapye', distance: 280, duration: 210 },
      { name: 'Maun-Kasane', origin: 'Maun', destination: 'Kasane', distance: 320, duration: 240 },
    ];

    for (const route of routeData) {
      const created = await prisma.route.upsert({
        where: { name: route.name },
        update: {},
        create: route,
      });
      routes.push(created);
    }
    console.log(`✅ Created ${routes.length} routes`);

    // Create Buses
    const buses = [];
    const busData = [
      { registrationNumber: 'B 101 KJK', model: 'Scania Marcopolo', capacity: 50, status: 'ACTIVE', yearOfManufacture: 2022, mileage: 45000 },
      { registrationNumber: 'B 102 KJK', model: 'Mercedes-Benz Tourismo', capacity: 55, status: 'ACTIVE', yearOfManufacture: 2021, mileage: 78000 },
      { registrationNumber: 'B 103 KJK', model: 'Volvo 9700', capacity: 48, status: 'ACTIVE', yearOfManufacture: 2023, mileage: 23000 },
      { registrationNumber: 'B 104 KJK', model: 'Scania Irizar', capacity: 52, status: 'MAINTENANCE', yearOfManufacture: 2020, mileage: 125000 },
      { registrationNumber: 'B 105 KJK', model: 'MAN Lion\'s Coach', capacity: 50, status: 'ACTIVE', yearOfManufacture: 2022, mileage: 56000 },
      { registrationNumber: 'B 106 KJK', model: 'Scania Marcopolo', capacity: 50, status: 'ACTIVE', yearOfManufacture: 2023, mileage: 12000 },
      { registrationNumber: 'B 107 KJK', model: 'Mercedes-Benz Tourismo', capacity: 55, status: 'ACTIVE', yearOfManufacture: 2021, mileage: 89000 },
      { registrationNumber: 'B 108 KJK', model: 'Volvo 9700', capacity: 48, status: 'INACTIVE', yearOfManufacture: 2019, mileage: 145000 },
    ];

    for (const bus of busData) {
      const created = await prisma.bus.upsert({
        where: { registrationNumber: bus.registrationNumber },
        update: {},
        create: bus,
      });
      buses.push(created);
    }
    console.log(`✅ Created ${buses.length} buses`);

    // Create Drivers
    const drivers = [];
    const driverData = [
      { firstName: 'Thabo', lastName: 'Moeti', name: 'Thabo Moeti', licenseNumber: 'DL001234', licenseExpiry: new Date('2026-08-15'), phone: '+267 71 234 567', email: 'thabo@kjkhandala.com', status: 'ACTIVE', hireDate: new Date('2020-01-15') },
      { firstName: 'Mpho', lastName: 'Kgosi', name: 'Mpho Kgosi', licenseNumber: 'DL005678', licenseExpiry: new Date('2025-12-20'), phone: '+267 71 345 678', email: 'mpho@kjkhandala.com', status: 'ACTIVE', hireDate: new Date('2019-06-10') },
      { firstName: 'Lesego', lastName: 'Tsheko', name: 'Lesego Tsheko', licenseNumber: 'DL009012', licenseExpiry: new Date('2026-03-05'), phone: '+267 71 456 789', email: 'lesego@kjkhandala.com', status: 'ACTIVE', hireDate: new Date('2021-03-22') },
      { firstName: 'Kabo', lastName: 'Segwai', name: 'Kabo Segwai', licenseNumber: 'DL003456', licenseExpiry: new Date('2024-11-30'), phone: '+267 71 567 890', email: 'kabo@kjkhandala.com', status: 'ACTIVE', hireDate: new Date('2018-09-01') },
      { firstName: 'Neo', lastName: 'Modise', name: 'Neo Modise', licenseNumber: 'DL007890', licenseExpiry: new Date('2026-05-18'), phone: '+267 71 678 901', email: 'neo@kjkhandala.com', status: 'ACTIVE', hireDate: new Date('2022-01-10') },
      { firstName: 'Kitso', lastName: 'Mogwe', name: 'Kitso Mogwe', licenseNumber: 'DL002345', licenseExpiry: new Date('2025-09-25'), phone: '+267 71 789 012', email: 'kitso@kjkhandala.com', status: 'ACTIVE', hireDate: new Date('2020-07-15') },
    ];

    for (const driver of driverData) {
      const created = await prisma.driver.upsert({
        where: { licenseNumber: driver.licenseNumber },
        update: {},
        create: driver,
      });
      drivers.push(created);
    }
    console.log(`✅ Created ${drivers.length} drivers`);

    // Create Trips for today and upcoming days
    const trips = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Today's trips
    const todayTrips = [
      { routeId: routes[0].id, busId: buses[0].id, driverId: drivers[0].id, hour: 6, status: 'COMPLETED', fare: 250 },
      { routeId: routes[0].id, busId: buses[1].id, driverId: drivers[1].id, hour: 8, status: 'IN_PROGRESS', fare: 250 },
      { routeId: routes[1].id, busId: buses[2].id, driverId: drivers[2].id, hour: 7, status: 'DELAYED', fare: 380 },
      { routeId: routes[2].id, busId: buses[4].id, driverId: drivers[3].id, hour: 9, status: 'SCHEDULED', fare: 320 },
      { routeId: routes[3].id, busId: buses[5].id, driverId: drivers[4].id, hour: 10, status: 'SCHEDULED', fare: 180 },
      { routeId: routes[0].id, busId: buses[6].id, driverId: drivers[5].id, hour: 14, status: 'SCHEDULED', fare: 250 },
      { routeId: routes[1].id, busId: buses[0].id, driverId: drivers[0].id, hour: 15, status: 'SCHEDULED', fare: 380 },
      { routeId: routes[4].id, busId: buses[1].id, driverId: drivers[1].id, hour: 16, status: 'SCHEDULED', fare: 280 },
    ];

    for (const tripData of todayTrips) {
      const departureTime = new Date(today);
      departureTime.setHours(tripData.hour, 0, 0, 0);
      
      const route = routes.find(r => r.id === tripData.routeId);
      const arrivalTime = new Date(departureTime);
      arrivalTime.setMinutes(arrivalTime.getMinutes() + route.duration);

      const trip = await prisma.trip.create({
        data: {
          routeId: tripData.routeId,
          busId: tripData.busId,
          driverId: tripData.driverId,
          departureDate: today,
          departureTime: departureTime,
          arrivalTime: arrivalTime,
          fare: tripData.fare,
          status: tripData.status,
        },
      });
      trips.push(trip);
    }

    // Tomorrow's trips
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tomorrowTrips = [
      { routeId: routes[0].id, busId: buses[0].id, driverId: drivers[0].id, hour: 6, status: 'SCHEDULED', fare: 250 },
      { routeId: routes[1].id, busId: buses[1].id, driverId: drivers[1].id, hour: 7, status: 'SCHEDULED', fare: 380 },
      { routeId: routes[2].id, busId: buses[2].id, driverId: drivers[2].id, hour: 8, status: 'SCHEDULED', fare: 320 },
      { routeId: routes[3].id, busId: buses[4].id, driverId: drivers[3].id, hour: 9, status: 'SCHEDULED', fare: 180 },
    ];

    for (const tripData of tomorrowTrips) {
      const departureTime = new Date(tomorrow);
      departureTime.setHours(tripData.hour, 0, 0, 0);
      
      const route = routes.find(r => r.id === tripData.routeId);
      const arrivalTime = new Date(departureTime);
      arrivalTime.setMinutes(arrivalTime.getMinutes() + route.duration);

      const trip = await prisma.trip.create({
        data: {
          routeId: tripData.routeId,
          busId: tripData.busId,
          driverId: tripData.driverId,
          departureDate: tomorrow,
          departureTime: departureTime,
          arrivalTime: arrivalTime,
          fare: tripData.fare,
          status: tripData.status,
        },
      });
      trips.push(trip);
    }
    console.log(`✅ Created ${trips.length} trips`);

    // Create Bookings for trips
    const passengers = [];
    for (let i = 0; i < 20; i++) {
      const passenger = await prisma.user.upsert({
        where: { email: `passenger${i}@example.com` },
        update: {},
        create: {
          email: `passenger${i}@example.com`,
          password: hashedPassword,
          firstName: `Passenger${i}`,
          lastName: 'User',
          phone: `+267 72 ${String(i).padStart(6, '0')}`,
          role: 'PASSENGER',
        },
      });
      passengers.push(passenger);
    }
    console.log(`✅ Created ${passengers.length} passengers`);

    // Create bookings for each trip
    let bookingCount = 0;
    for (const trip of trips) {
      const bus = buses.find(b => b.id === trip.busId);
      const numBookings = Math.floor(Math.random() * (bus.capacity * 0.8)) + Math.floor(bus.capacity * 0.2); // 20-100% capacity
      
      for (let i = 0; i < Math.min(numBookings, passengers.length); i++) {
        await prisma.booking.create({
          data: {
            tripId: trip.id,
            passengerId: passengers[i % passengers.length].id,
            seatNumber: `S${i + 1}`,
            fare: trip.fare,
            totalAmount: trip.fare,
            status: 'CONFIRMED',
            paymentStatus: Math.random() > 0.1 ? 'PAID' : 'PENDING',
            bookingDate: new Date(),
          },
        });
        bookingCount++;
      }
    }
    console.log(`✅ Created ${bookingCount} bookings`);

    // Create Incidents
    const incidents = [
      {
        tripId: trips[2].id, // The delayed trip
        type: 'delay',
        severity: 'MEDIUM',
        description: 'Traffic congestion due to road construction',
        location: 'A1 Highway near Palapye',
        status: 'INVESTIGATING',
        reportedById: operationsManager.id,
      },
      {
        busId: buses[3].id, // Bus in maintenance
        type: 'breakdown',
        severity: 'HIGH',
        description: 'Engine overheating issue detected',
        location: 'Francistown Terminal',
        status: 'RESOLVED',
        resolution: 'Cooling system repaired and tested',
        reportedById: operationsManager.id,
        resolvedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      },
      {
        tripId: trips[1].id,
        type: 'passenger_emergency',
        severity: 'MEDIUM',
        description: 'Passenger feeling unwell, requested medical attention',
        location: 'Near Mahalapye',
        status: 'RESOLVED',
        resolution: 'Passenger received first aid, continued journey',
        reportedById: operationsManager.id,
        resolvedAt: new Date(),
      },
    ];

    for (const incident of incidents) {
      await prisma.incident.create({
        data: incident,
      });
    }
    console.log(`✅ Created ${incidents.length} incidents`);

    // Create Maintenance Records
    const maintenanceRecords = [
      {
        busId: buses[0].id,
        date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        type: 'preventive',
        description: 'Regular 10,000km service',
        cost: 3500,
        mileage: 45000,
        technician: 'Tebogo Motlhale',
      },
      {
        busId: buses[1].id,
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        type: 'preventive',
        description: 'Oil change and filter replacement',
        cost: 1200,
        mileage: 78000,
        technician: 'Boitumelo Khumo',
      },
      {
        busId: buses[3].id,
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Yesterday
        type: 'corrective',
        description: 'Engine cooling system repair',
        cost: 8500,
        mileage: 125000,
        technician: 'Kagiso Moeng',
      },
    ];

    for (const record of maintenanceRecords) {
      await prisma.maintenanceRecord.create({
        data: record,
      });
    }
    console.log(`✅ Created ${maintenanceRecords.length} maintenance records`);

    console.log('✅ Operations data seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding operations data:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
