/**
 * E-Ticket Delivery System
 * Handles sending tickets via Email and WhatsApp
 */

interface TicketData {
  bookingReference: string;
  ticketNumber: string;
  passengerName: string;
  passengerPhone: string;
  passengerEmail?: string;
  origin: string;
  destination: string;
  date: string;
  time: string;
  seat: string;
  amount: number;
  bus: string;
}

/**
 * Send e-ticket via Email
 * This would typically call a backend API endpoint
 */
export async function sendTicketViaEmail(ticketData: TicketData): Promise<boolean> {
  try {
    // TODO: Replace with actual backend API call
    // Example: await fetch('/api/tickets/send-email', { method: 'POST', body: JSON.stringify(ticketData) })
    
    const emailBody = generateEmailBody(ticketData);
    
    console.log('Sending email to:', ticketData.passengerEmail);
    console.log('Email body:', emailBody);
    
    // For now, return success
    // In production, this should call your email service (SendGrid, AWS SES, etc.)
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Send e-ticket via WhatsApp
 * Opens WhatsApp with pre-filled message
 */
export function sendTicketViaWhatsApp(ticketData: TicketData): void {
  const message = generateWhatsAppMessage(ticketData);
  const phoneNumber = ticketData.passengerPhone.replace(/\D/g, ''); // Remove non-digits
  
  // WhatsApp URL format
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
  
  // Open in new window
  window.open(whatsappUrl, '_blank');
}

/**
 * Send e-ticket via SMS
 * This would typically call a backend API endpoint
 */
export async function sendTicketViaSMS(ticketData: TicketData): Promise<boolean> {
  try {
    const smsBody = generateSMSMessage(ticketData);
    
    console.log('Sending SMS to:', ticketData.passengerPhone);
    console.log('SMS body:', smsBody);
    
    // TODO: Implement SMS sending via backend API (Twilio, Africa's Talking, etc.)
    return true;
  } catch (error) {
    console.error('Error sending SMS:', error);
    return false;
  }
}

/**
 * Generate email body HTML
 */
function generateEmailBody(data: TicketData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1a56db; color: white; padding: 20px; text-align: center; }
    .ticket { background: #f9fafb; border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .label { font-weight: bold; color: #6b7280; }
    .value { color: #111827; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
    .booking-ref { font-size: 24px; font-weight: bold; color: #1a56db; text-align: center; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>KJ Khandala Travel & Tours</h1>
      <p>Your E-Ticket Confirmation</p>
    </div>
    
    <div class="booking-ref">
      Booking Reference: ${data.bookingReference}
    </div>
    
    <div class="ticket">
      <h2>Trip Details</h2>
      <div class="row">
        <span class="label">Route:</span>
        <span class="value">${data.origin} → ${data.destination}</span>
      </div>
      <div class="row">
        <span class="label">Date:</span>
        <span class="value">${new Date(data.date).toLocaleDateString('en-GB')}</span>
      </div>
      <div class="row">
        <span class="label">Departure Time:</span>
        <span class="value">${data.time}</span>
      </div>
      <div class="row">
        <span class="label">Passenger:</span>
        <span class="value">${data.passengerName}</span>
      </div>
      <div class="row">
        <span class="label">Seat Number:</span>
        <span class="value">${data.seat}</span>
      </div>
      <div class="row">
        <span class="label">Coach:</span>
        <span class="value">${data.bus}</span>
      </div>
      <div class="row">
        <span class="label">Ticket Number:</span>
        <span class="value">${data.ticketNumber}</span>
      </div>
      <div class="row">
        <span class="label">Amount Paid:</span>
        <span class="value">P${data.amount}</span>
      </div>
    </div>
    
    <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0; color: #92400e;">
        <strong>Important:</strong> Please arrive at the terminal at least 30 minutes before departure.
      </p>
    </div>
    
    <div class="footer">
      <p>For assistance, contact us:</p>
      <p>Phone: +267 123 4567 | WhatsApp: +267 123 4567</p>
      <p>Email: support@kjkhandala.com</p>
      <p>&copy; ${new Date().getFullYear()} KJ Khandala Travel & Tours. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate WhatsApp message
 */
function generateWhatsAppMessage(data: TicketData): string {
  return `
🎫 *KJ KHANDALA E-TICKET*

*Booking Reference:* ${data.bookingReference}
*Ticket Number:* ${data.ticketNumber}

*TRIP DETAILS*
📍 Route: ${data.origin} → ${data.destination}
📅 Date: ${new Date(data.date).toLocaleDateString('en-GB')}
🕐 Departure: ${data.time}

*PASSENGER DETAILS*
👤 Name: ${data.passengerName}
💺 Seat: ${data.seat}
🚌 Coach: ${data.bus}

*PAYMENT*
💰 Amount: P${data.amount}

⚠️ *Important:* Please arrive at the terminal at least 30 minutes before departure.

For assistance:
📞 +267 123 4567
📧 support@kjkhandala.com

_Thank you for choosing KJ Khandala Travel & Tours!_
  `.trim();
}

/**
 * Generate SMS message (shorter version)
 */
function generateSMSMessage(data: TicketData): string {
  return `KJ Khandala E-Ticket\nRef: ${data.bookingReference}\n${data.origin}-${data.destination}\nDate: ${new Date(data.date).toLocaleDateString('en-GB')}\nTime: ${data.time}\nSeat: ${data.seat}\nAmount: P${data.amount}\nArrival: 30min before departure`;
}

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (Botswana format)
 */
export function isValidPhone(phone: string): boolean {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Check if it's a valid Botswana number (starts with 267 or local format)
  return cleaned.length >= 8 && cleaned.length <= 12;
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('267')) {
    // International format: +267 XX XXX XXX
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
  } else {
    // Local format: XX XXX XXX
    return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5)}`;
  }
}
