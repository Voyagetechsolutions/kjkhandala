// Test payment initialization
const axios = require('axios');

async function testPayment() {
  try {
    console.log('Testing payment initialization...');
    
    const response = await axios.post('http://localhost:3001/api/payments/initialize', {
      bookingId: 'test-booking-123',
      amount: 100,
      currency: 'BWP',
      customerEmail: 'test@example.com',
      customerFirstName: 'John',
      customerLastName: 'Doe',
      customerPhone: '+26771234567',
      customerCountry: 'BW',
    }, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('Payment initialization successful:', response.data);
  } catch (error) {
    console.error('Payment initialization failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

testPayment();
