const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const prisma = new PrismaClient();

class QueueProcessor {
  constructor() {
    // Email transporter
    this.emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    // Twilio client
    this.twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }

  /**
   * Process Email Queue
   */
  async processEmailQueue() {
    try {
      const pendingEmails = await prisma.emailQueue.findMany({
        where: {
          status: 'PENDING',
          attempts: { lt: 3 }
        },
        take: 10
      });

      for (const email of pendingEmails) {
        try {
          await this.emailTransporter.sendMail({
            from: process.env.SMTP_FROM,
            to: email.toEmail,
            subject: email.subject,
            html: email.body
          });

          await prisma.emailQueue.update({
            where: { id: email.id },
            data: {
              status: 'SENT',
              sentAt: new Date()
            }
          });

          console.log(`✅ Email sent to ${email.toEmail}`);
        } catch (error) {
          await prisma.emailQueue.update({
            where: { id: email.id },
            data: {
              attempts: email.attempts + 1,
              error: error.message,
              status: email.attempts >= 2 ? 'FAILED' : 'PENDING'
            }
          });

          console.error(`❌ Email failed for ${email.toEmail}:`, error.message);
        }
      }

      return pendingEmails.length;
    } catch (error) {
      console.error('Email queue processing error:', error);
      return 0;
    }
  }

  /**
   * Process SMS Queue
   */
  async processSmsQueue() {
    try {
      const pendingSms = await prisma.smsQueue.findMany({
        where: {
          status: 'PENDING',
          attempts: { lt: 3 }
        },
        take: 10
      });

      for (const sms of pendingSms) {
        try {
          await this.twilioClient.messages.create({
            body: sms.message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: sms.phone
          });

          await prisma.smsQueue.update({
            where: { id: sms.id },
            data: {
              status: 'SENT',
              sentAt: new Date()
            }
          });

          console.log(`✅ SMS sent to ${sms.phone}`);
        } catch (error) {
          await prisma.smsQueue.update({
            where: { id: sms.id },
            data: {
              attempts: sms.attempts + 1,
              error: error.message,
              status: sms.attempts >= 2 ? 'FAILED' : 'PENDING'
            }
          });

          console.error(`❌ SMS failed for ${sms.phone}:`, error.message);
        }
      }

      return pendingSms.length;
    } catch (error) {
      console.error('SMS queue processing error:', error);
      return 0;
    }
  }

  /**
   * Clean Old Messages
   */
  async cleanOldMessages() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7); // 7 days old

    try {
      const deletedEmails = await prisma.emailQueue.deleteMany({
        where: {
          status: { in: ['SENT', 'FAILED'] },
          createdAt: { lt: cutoffDate }
        }
      });

      const deletedSms = await prisma.smsQueue.deleteMany({
        where: {
          status: { in: ['SENT', 'FAILED'] },
          createdAt: { lt: cutoffDate }
        }
      });

      console.log(`🧹 Cleaned ${deletedEmails.count} emails and ${deletedSms.count} SMS`);
      return { emails: deletedEmails.count, sms: deletedSms.count };
    } catch (error) {
      console.error('Cleanup error:', error);
      return { emails: 0, sms: 0 };
    }
  }

  /**
   * Start Queue Processing
   */
  start() {
    console.log('📬 Starting queue processors...');

    // Process email queue every minute
    setInterval(async () => {
      const processed = await this.processEmailQueue();
      if (processed > 0) {
        console.log(`📧 Processed ${processed} emails`);
      }
    }, 60 * 1000);

    // Process SMS queue every minute
    setInterval(async () => {
      const processed = await this.processSmsQueue();
      if (processed > 0) {
        console.log(`📱 Processed ${processed} SMS`);
      }
    }, 60 * 1000);

    // Clean old messages daily at 3 AM
    const now = new Date();
    const next3AM = new Date(now);
    next3AM.setHours(3, 0, 0, 0);
    if (next3AM < now) {
      next3AM.setDate(next3AM.getDate() + 1);
    }
    const msUntil3AM = next3AM - now;

    setTimeout(() => {
      this.cleanOldMessages();
      setInterval(() => this.cleanOldMessages(), 24 * 60 * 60 * 1000);
    }, msUntil3AM);

    console.log('✅ Queue processors started');
  }
}

module.exports = new QueueProcessor();
