const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const prisma = new PrismaClient();

class NotificationEngine {
  constructor() {
    // Email configuration (using nodemailer)
    this.emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    // SMS configuration (using Twilio)
    this.smsClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
      ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
      : null;

    this.twilioPhone = process.env.TWILIO_PHONE_NUMBER;
  }

  /**
   * SEND NOTIFICATION (In-App)
   */
  async send(notificationData) {
    const { userId, type, title, message, data } = notificationData;

    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data: data || {},
        read: false,
        createdAt: new Date()
      }
    });

    // Emit WebSocket event for real-time notification
    if (global.io) {
      global.io.to(`user-${userId}`).emit('notification', notification);
    }

    return notification;
  }

  /**
   * SEND TO MULTIPLE USERS
   */
  async sendToUsers(userIds, notificationData) {
    const notifications = await Promise.all(
      userIds.map(userId => this.send({ ...notificationData, userId }))
    );
    return notifications;
  }

  /**
   * SEND TO ROLE
   */
  async sendToRole(role, notificationData) {
    const users = await prisma.user.findMany({
      where: { role },
      select: { id: true }
    });

    return await this.sendToUsers(
      users.map(u => u.id),
      notificationData
    );
  }

  /**
   * SEND EMAIL
   */
  async sendEmail(emailData) {
    const { to, subject, html, text } = emailData;

    try {
      const info = await this.emailTransporter.sendMail({
        from: process.env.SMTP_FROM || '"Voyage Onboard" <noreply@voyage.com>',
        to,
        subject,
        text,
        html
      });

      console.log('Email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Email error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * SEND SMS
   */
  async sendSMS(phone, message) {
    if (!this.smsClient) {
      console.warn('SMS not configured');
      return { success: false, error: 'SMS not configured' };
    }

    try {
      const result = await this.smsClient.messages.create({
        body: message,
        from: this.twilioPhone,
        to: phone
      });

      console.log('SMS sent:', result.sid);
      return { success: true, sid: result.sid };
    } catch (error) {
      console.error('SMS error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * SEND OTP
   */
  async sendOTP(phone, code) {
    const message = `Your Voyage Onboard verification code is: ${code}. Valid for 10 minutes.`;
    return await this.sendSMS(phone, message);
  }

  /**
   * SEND BOOKING CONFIRMATION EMAIL
   */
  async sendBookingConfirmation(booking) {
    const passenger = await prisma.passenger.findUnique({
      where: { id: booking.passengerId },
      include: { user: true }
    });

    const trip = await prisma.trip.findUnique({
      where: { id: booking.tripId },
      include: { route: true, bus: true }
    });

    const html = `
      <h2>Booking Confirmation</h2>
      <p>Dear ${passenger.name},</p>
      <p>Your booking has been confirmed!</p>
      
      <h3>Trip Details:</h3>
      <ul>
        <li><strong>Ticket Number:</strong> ${booking.ticketNumber}</li>
        <li><strong>Route:</strong> ${trip.route.origin} → ${trip.route.destination}</li>
        <li><strong>Departure:</strong> ${new Date(trip.departureTime).toLocaleString()}</li>
        <li><strong>Seat:</strong> ${booking.seatNumber}</li>
        <li><strong>Bus:</strong> ${trip.bus.registrationNumber}</li>
        <li><strong>Amount Paid:</strong> BWP ${booking.totalAmount}</li>
      </ul>
      
      <p>Please arrive 30 minutes before departure.</p>
      <p>Thank you for choosing Voyage Onboard!</p>
    `;

    return await this.sendEmail({
      to: passenger.email,
      subject: 'Booking Confirmation - Voyage Onboard',
      html,
      text: `Your booking is confirmed. Ticket: ${booking.ticketNumber}`
    });
  }

  /**
   * SEND BOOKING CONFIRMATION SMS
   */
  async sendBookingConfirmationSMS(booking) {
    const passenger = await prisma.passenger.findUnique({
      where: { id: booking.passengerId }
    });

    const trip = await prisma.trip.findUnique({
      where: { id: booking.tripId },
      include: { route: true }
    });

    const message = `Booking confirmed! Ticket: ${booking.ticketNumber}. ${trip.route.origin} to ${trip.route.destination} on ${new Date(trip.departureTime).toLocaleDateString()}. Seat: ${booking.seatNumber}. Arrive 30 min early.`;

    return await this.sendSMS(passenger.phone, message);
  }

  /**
   * SEND TRIP REMINDER
   */
  async sendTripReminder(tripId) {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        route: true,
        bookings: {
          where: {
            bookingStatus: 'CONFIRMED',
            paymentStatus: 'PAID'
          },
          include: {
            passenger: true
          }
        }
      }
    });

    for (const booking of trip.bookings) {
      // Send in-app notification
      if (booking.passenger.userId) {
        await this.send({
          userId: booking.passenger.userId,
          type: 'TRIP_REMINDER',
          title: 'Trip Reminder',
          message: `Your trip from ${trip.route.origin} to ${trip.route.destination} departs in 24 hours.`,
          data: { tripId, bookingId: booking.id }
        });
      }

      // Send SMS
      const smsMessage = `Reminder: Your trip departs tomorrow at ${new Date(trip.departureTime).toLocaleTimeString()}. Ticket: ${booking.ticketNumber}. Arrive 30 min early.`;
      await this.sendSMS(booking.passenger.phone, smsMessage);
    }
  }

  /**
   * SEND PASSWORD RESET EMAIL
   */
  async sendPasswordReset(user, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const html = `
      <h2>Password Reset Request</h2>
      <p>Hello ${user.name},</p>
      <p>You requested to reset your password. Click the link below to reset it:</p>
      <p><a href="${resetUrl}">Reset Password</a></p>
      <p>This link expires in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `;

    return await this.sendEmail({
      to: user.email,
      subject: 'Password Reset - Voyage Onboard',
      html,
      text: `Reset your password: ${resetUrl}`
    });
  }

  /**
   * MARK NOTIFICATION AS READ
   */
  async markAsRead(notificationId) {
    return await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true }
    });
  }

  /**
   * MARK ALL AS READ
   */
  async markAllAsRead(userId) {
    return await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true }
    });
  }

  /**
   * GET USER NOTIFICATIONS
   */
  async getUserNotifications(userId, limit = 50) {
    return await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }

  /**
   * GET UNREAD COUNT
   */
  async getUnreadCount(userId) {
    return await prisma.notification.count({
      where: { userId, read: false }
    });
  }

  /**
   * DELETE OLD NOTIFICATIONS (cleanup)
   */
  async cleanupOldNotifications(daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const deleted = await prisma.notification.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        read: true
      }
    });

    console.log(`Deleted ${deleted.count} old notifications`);
    return deleted;
  }

  /**
   * MARK ALL AS READ
   */
  async markAllAsRead(userId) {
    return await prisma.notification.updateMany({
      where: {
        userId,
        read: false
      },
      data: {
        read: true
      }
    });
  }

  /**
   * DELETE NOTIFICATION
   */
  async deleteNotification(notificationId) {
    return await prisma.notification.delete({
      where: {
        id: notificationId
      }
    });
  }
}

module.exports = new NotificationEngine();
