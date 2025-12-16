/**
 * Generate a unique booking reference number
 * Format: KJ-YYYYMMDD-XXXX (e.g., KJ-20231115-A1B2)
 */
export function generateBookingReference(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  // Generate random alphanumeric code
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding confusing characters
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return `KJ-${year}${month}${day}-${code}`;
}

/**
 * Generate a unique e-ticket number
 * Format: TKT-XXXXXXXXXX (10 digit number)
 */
export function generateTicketNumber(): string {
  const timestamp = Date.now().toString().slice(-10);
  return `TKT-${timestamp}`;
}

/**
 * Generate QR code data for e-ticket
 */
export function generateQRCodeData(bookingReference: string, ticketNumber: string, passengerName: string): string {
  return JSON.stringify({
    booking: bookingReference,
    ticket: ticketNumber,
    passenger: passengerName,
    issuer: 'KJ Khandala Travel & Tours',
    timestamp: new Date().toISOString()
  });
}
