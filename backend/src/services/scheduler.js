const cron = require('node-cron');
const bookingEngine = require('./bookingEngine');
const tripEngine = require('./tripEngine');
const notificationEngine = require('./notificationEngine');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class Scheduler {
  start() {
    console.log('🕐 Starting scheduled tasks...');

    // Clean expired seat holds every 2 minutes
    cron.schedule('*/2 * * * *', async () => {
      try {
        await bookingEngine.cleanExpiredHolds();
      } catch (error) {
        console.error('Error cleaning seat holds:', error);
      }
    });

    // Auto-transition trip statuses every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      try {
        await tripEngine.autoTransitionTrips();
      } catch (error) {
        console.error('Error auto-transitioning trips:', error);
      }
    });

    // Check for delays every 10 minutes
    cron.schedule('*/10 * * * *', async () => {
      try {
        await tripEngine.checkDelays();
      } catch (error) {
        console.error('Error checking delays:', error);
      }
    });

    // Send trip reminders at 8 AM daily (24 hours before departure)
    cron.schedule('0 8 * * *', async () => {
      try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const dayAfter = new Date(tomorrow);
        dayAfter.setDate(dayAfter.getDate() + 1);

        const trips = await prisma.trip.findMany({
          where: {
            departureTime: {
              gte: tomorrow,
              lt: dayAfter
            },
            status: { in: ['SCHEDULED', 'BOARDING'] }
          }
        });

        for (const trip of trips) {
          await notificationEngine.sendTripReminder(trip.id);
        }

        console.log(`Sent reminders for ${trips.length} trips`);
      } catch (error) {
        console.error('Error sending trip reminders:', error);
      }
    });

    // Clean old notifications at 2 AM daily
    cron.schedule('0 2 * * *', async () => {
      try {
        await notificationEngine.cleanupOldNotifications(30);
      } catch (error) {
        console.error('Error cleaning notifications:', error);
      }
    });

    console.log('✅ Scheduled tasks started');
  }
}

module.exports = new Scheduler();
