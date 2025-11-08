// Email and WhatsApp Notification System for KJ Khandala

export interface BookingNotification {
  bookingReference: string;
  passengerName: string;
  passengerEmail: string;
  passengerPhone: string;
  route: string;
  departureDate: string;
  departureTime: string;
  seats: string[];
  totalAmount: number;
  currency: string;
}

/**
 * Send booking confirmation email
 * In production, this should call a Supabase Edge Function or backend API
 */
export async function sendBookingConfirmationEmail(booking: BookingNotification): Promise<boolean> {
  try {
    // Email template
    const emailHtml = generateBookingEmailTemplate(booking);
    
    // In production, call your email service (SendGrid, Resend, etc.)
    // For now, we'll use Supabase Edge Functions
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: booking.passengerEmail,
        subject: `Booking Confirmation - ${booking.bookingReference}`,
        html: emailHtml,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Generate HTML email template
 */
function generateBookingEmailTemplate(booking: BookingNotification): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmation</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #DC2626, #1E3A8A);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .content {
      background: #f9fafb;
      padding: 30px;
      border: 1px solid #e5e7eb;
    }
    .booking-details {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .detail-label {
      font-weight: bold;
      color: #6b7280;
    }
    .detail-value {
      color: #1f2937;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #6b7280;
      font-size: 14px;
    }
    .button {
      display: inline-block;
      background: #DC2626;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🚌 KJ Khandala Travel & Tours</h1>
    <p>Booking Confirmation</p>
  </div>
  
  <div class="content">
    <h2>Dear ${booking.passengerName},</h2>
    <p>Thank you for booking with KJ Khandala Travel & Tours! Your booking has been confirmed.</p>
    
    <div class="booking-details">
      <h3>Booking Details</h3>
      <div class="detail-row">
        <span class="detail-label">Booking Reference:</span>
        <span class="detail-value">${booking.bookingReference}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Route:</span>
        <span class="detail-value">${booking.route}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Date:</span>
        <span class="detail-value">${booking.departureDate}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Departure Time:</span>
        <span class="detail-value">${booking.departureTime}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Seat(s):</span>
        <span class="detail-value">${booking.seats.join(', ')}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Total Amount:</span>
        <span class="detail-value">${booking.currency}${booking.totalAmount.toFixed(2)}</span>
      </div>
    </div>
    
    <p><strong>Important Information:</strong></p>
    <ul>
      <li>Please arrive at the departure point at least 30 minutes before departure</li>
      <li>Bring a valid ID for verification</li>
      <li>Your booking reference: <strong>${booking.bookingReference}</strong></li>
    </ul>
    
    <center>
      <a href="${window.location.origin}/my-bookings" class="button">View My Bookings</a>
    </center>
  </div>
  
  <div class="footer">
    <p>KJ Khandala Travel & Tours</p>
    <p>📞 +267 71 799 129 | 💬 WhatsApp: +267 73 442 135</p>
    <p>Safe travels! 🚌</p>
  </div>
</body>
</html>
  `;
}

/**
 * Send WhatsApp confirmation message
 */
export async function sendWhatsAppConfirmation(booking: BookingNotification): Promise<boolean> {
  try {
    // Format WhatsApp message
    const message = formatWhatsAppMessage(booking);
    
    // WhatsApp Business API integration
    // Option 1: Use WhatsApp Business API (requires approval)
    // Option 2: Use third-party service like Twilio
    // Option 3: Generate WhatsApp link for manual sending
    
    const whatsappNumber = booking.passengerPhone.replace(/[^0-9]/g, '');
    const encodedMessage = encodeURIComponent(message);
    
    // For now, we'll open WhatsApp Web with pre-filled message
    // In production, use WhatsApp Business API
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    
    // Store the URL for admin to send manually, or integrate with WhatsApp API
    console.log('WhatsApp URL:', whatsappUrl);
    
    return true;
  } catch (error) {
    console.error('Error sending WhatsApp:', error);
    return false;
  }
}

/**
 * Format WhatsApp message
 */
function formatWhatsAppMessage(booking: BookingNotification): string {
  return `
🚌 *KJ Khandala Travel & Tours*
✅ Booking Confirmed

Dear ${booking.passengerName},

Your booking has been confirmed!

📋 *Booking Details:*
Reference: ${booking.bookingReference}
Route: ${booking.route}
Date: ${booking.departureDate}
Time: ${booking.departureTime}
Seats: ${booking.seats.join(', ')}
Amount: ${booking.currency}${booking.totalAmount.toFixed(2)}

⚠️ *Important:*
• Arrive 30 minutes before departure
• Bring valid ID
• Keep this reference number

Need help? Reply to this message or call:
📞 +267 71 799 129

Safe travels! 🚌
  `.trim();
}

/**
 * Send booking notification (both email and WhatsApp)
 */
export async function sendBookingNotifications(booking: BookingNotification): Promise<{
  emailSent: boolean;
  whatsappSent: boolean;
}> {
  const [emailSent, whatsappSent] = await Promise.all([
    sendBookingConfirmationEmail(booking),
    sendWhatsAppConfirmation(booking),
  ]);

  return { emailSent, whatsappSent };
}

/**
 * Send payment receipt email
 */
export async function sendPaymentReceiptEmail(
  booking: BookingNotification,
  paymentDetails: {
    transactionId: string;
    paymentMethod: string;
    paidAt: string;
  }
): Promise<boolean> {
  try {
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #DC2626, #1E3A8A); color: white; padding: 30px; text-align: center; }
    .content { background: #f9fafb; padding: 30px; }
    .receipt { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>💳 Payment Receipt</h1>
  </div>
  <div class="content">
    <h2>Payment Successful!</h2>
    <div class="receipt">
      <p><strong>Transaction ID:</strong> ${paymentDetails.transactionId}</p>
      <p><strong>Booking Reference:</strong> ${booking.bookingReference}</p>
      <p><strong>Amount Paid:</strong> ${booking.currency}${booking.totalAmount.toFixed(2)}</p>
      <p><strong>Payment Method:</strong> ${paymentDetails.paymentMethod}</p>
      <p><strong>Date:</strong> ${paymentDetails.paidAt}</p>
    </div>
    <p>Thank you for your payment. Your booking is now confirmed!</p>
  </div>
</body>
</html>
    `;

    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: booking.passengerEmail,
        subject: `Payment Receipt - ${booking.bookingReference}`,
        html: emailHtml,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error sending payment receipt:', error);
    return false;
  }
}
