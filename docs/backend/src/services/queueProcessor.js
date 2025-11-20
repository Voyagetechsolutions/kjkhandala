const { supabase } = require('../config/supabase');
const nodemailer = require('nodemailer');
const twilio = require('twilio');

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
      const { data: pendingEmails, error } = await supabase
        .from('email_queue')
        .select('*')
        .eq('status', 'PENDING')
        .lt('attempts', 3)
        .limit(10);
      
      if (error) throw error;

      for (const email of pendingEmails) {
        try {
          await this.emailTransporter.sendMail({
            from: process.env.SMTP_FROM,
            to: email.toEmail,
            subject: email.subject,
            html: email.body
          });

          await supabase
            .from('email_queue')
            .update({
              status: 'SENT',
              sent_at: new Date().toISOString()
            })
            .eq('id', email.id);

          console.log(`✅ Email sent to ${email.toEmail}`);
        } catch (error) {
          await supabase
            .from('email_queue')
            .update({
              attempts: email.attempts + 1,
              error: error.message,
              status: email.attempts >= 2 ? 'FAILED' : 'PENDING'
            })
            .eq('id', email.id);

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
      const { data: pendingSms, error } = await supabase
        .from('sms_queue')
        .select('*')
        .eq('status', 'PENDING')
        .lt('attempts', 3)
        .limit(10);
      
      if (error) throw error;

      for (const sms of pendingSms) {
        try {
          await this.twilioClient.messages.create({
            body: sms.message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: sms.phone
          });

          await supabase
            .from('sms_queue')
            .update({
              status: 'SENT',
              sent_at: new Date().toISOString()
            })
            .eq('id', sms.id);

          console.log(`✅ SMS sent to ${sms.phone}`);
        } catch (error) {
          await supabase
            .from('sms_queue')
            .update({
              attempts: sms.attempts + 1,
              error: error.message,
              status: sms.attempts >= 2 ? 'FAILED' : 'PENDING'
            })
            .eq('id', sms.id);

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
      const { data: deletedEmails } = await supabase
        .from('email_queue')
        .delete()
        .in('status', ['SENT', 'FAILED'])
        .lt('created_at', cutoffDate.toISOString());

      const { data: deletedSms } = await supabase
        .from('sms_queue')
        .delete()
        .in('status', ['SENT', 'FAILED'])
        .lt('created_at', cutoffDate.toISOString());

      const emailCount = deletedEmails?.length || 0;
      const smsCount = deletedSms?.length || 0;
      console.log(`🧹 Cleaned ${emailCount} emails and ${smsCount} SMS`);
      return { emails: emailCount, sms: smsCount };
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
